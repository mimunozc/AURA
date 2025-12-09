using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Text.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Aura.WebApi.Infrastructure;
using Aura.WebApi.Domain;
using Pgvector.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Npgsql;


var builder = WebApplication.CreateBuilder(args);

var cs = builder.Configuration.GetConnectionString("DefaultConnection");

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddDbContext<AuraDbContext>(options =>
{
    options.UseNpgsql(cs, o => o.UseVector());
});

var jwtKey = builder.Configuration["Auth:JwtKey"] ?? "aura-dev-key";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

var aiBaseUrl = builder.Configuration["Ai:BaseUrl"] ?? "http://localhost:8000";

builder.Services.AddHttpClient("ai", client =>
{
    client.BaseAddress = new Uri(aiBaseUrl);
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Aura.WebApi",
        Version = "v1"
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Bearer",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

var connectionString = app.Configuration.GetConnectionString("DefaultConnection")!;

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
    db.Database.EnsureCreated();

    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    if (!db.Users.Any(u => u.Id == userId))
    {
        db.Users.Add(new User
        {
            Id = userId,
            Email = "user@aura.cl",
            DisplayName = "Usuario Demo",
            CreatedAt = DateTimeOffset.UtcNow,
            PasswordHash = ""
        });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { service = "aura-api", status = "ok" }));

app.MapPost("/auth/login", (LoginIn input) =>
{
    var emailNorm = input.email.Trim().ToLowerInvariant();
    var pwd = input.password;

    Guid userId;
    string role;

    if (emailNorm == "user@aura.cl" && pwd == "Demo.1234")
    {
        userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        role = "user";
    }
    else if (emailNorm == "specialist@aura.cl" && pwd == "Demo.1234")
    {
        userId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        role = "specialist";
    }
    else
    {
        return Results.Unauthorized();
    }

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, emailNorm),
        new Claim("role", role)
    };

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddHours(12),
        signingCredentials: new SigningCredentials(
            new SymmetricSecurityKey(keyBytes),
            SecurityAlgorithms.HmacSha256
        )
    );

    var jwt = new JwtSecurityTokenHandler().WriteToken(token);
    return Results.Ok(new { token = jwt });
});

app.MapPost("/chat/start", async (AuraDbContext db, ClaimsPrincipal user) =>
{
    Guid userId;
    var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub);
    if (!Guid.TryParse(sub, out userId))
    {
        userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    var conv = new Conversation
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Conversations.Add(conv);
    await db.SaveChangesAsync();

    return Results.Ok(new { conversationId = conv.Id });
}).RequireAuthorization();

app.MapPost("/chat/send", async (ChatSendIn input, AuraDbContext db, IHttpClientFactory httpClientFactory, ClaimsPrincipal user) =>
{
    Guid userId;
    var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub);
    if (!Guid.TryParse(sub, out userId))
    {
        userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    var now = DateTimeOffset.UtcNow;

    var userMessage = new Message
    {
        ConversationId = input.conversationId,
        UserId = userId,
        Role = "user",
        Content = input.message,
        CreatedAt = now
    };

    db.Messages.Add(userMessage);
    await db.SaveChangesAsync();

    var history = await db.Messages
        .Where(m => m.ConversationId == input.conversationId)
        .OrderBy(m => m.CreatedAt)
        .Select(m => new { m.Role, m.Content })
        .ToListAsync();

    var payload = new
    {
        system = (string?)null,
        history = history.Select(m => new { role = m.Role, content = m.Content }).ToList(),
        user = input.message,
        followup = (string?)null
    };

    var client = httpClientFactory.CreateClient("ai");
    var response = await client.PostAsJsonAsync("/chat", payload);
    response.EnsureSuccessStatusCode();

    var resultJson = await response.Content.ReadFromJsonAsync<AiReplyResponse>();
    var reply = resultJson?.reply ?? "";

    var assistantMessage = new Message
    {
        ConversationId = input.conversationId,
        UserId = userId,
        Role = "assistant",
        Content = reply,
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.Messages.Add(assistantMessage);
    await db.SaveChangesAsync();

    var analyzePayload = new
    {
        message = input.message
    };

    var analyzeResponse = await client.PostAsJsonAsync("/analyze", analyzePayload);
    analyzeResponse.EnsureSuccessStatusCode();

    var analysisJson = await analyzeResponse.Content.ReadAsStringAsync();

    var analysis = new MessageAnalysis
    {
        MessageId = assistantMessage.Id,
        UserId = userId,
        Json = analysisJson,
        CreatedAt = assistantMessage.CreatedAt
    };

    db.MessageAnalyses.Add(analysis);
    await db.SaveChangesAsync();

    return Results.Ok(new { reply });
}).RequireAuthorization();


app.MapGet("/me/overview", async (AuraDbContext db, ClaimsPrincipal user) =>
{
    Guid userId;
    var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub);
    if (!Guid.TryParse(sub, out userId))
    {
        userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    var conversationsCount = await db.Conversations
        .Where(c => c.UserId == userId)
        .CountAsync();

    var messagesCount = await db.Messages
        .Where(m => m.UserId == userId)
        .CountAsync();

    var lastMessage = await db.Messages
        .Where(m => m.UserId == userId)
        .OrderByDescending(m => m.CreatedAt)
        .Select(m => new { m.Content, m.CreatedAt })
        .FirstOrDefaultAsync();

    var recentMessages = await db.Messages
        .Where(m => m.UserId == userId)
        .OrderByDescending(m => m.CreatedAt)
        .Take(3)
        .Select(m => new { m.Role, m.Content, m.CreatedAt })
        .ToListAsync();

    return Results.Ok(new
    {
        userId,
        conversationsCount,
        messagesCount,
        lastMessage,
        recentMessages
    });
}).RequireAuthorization();

// === Check-in ===

app.MapGet("/checkin/by-date", async (string userId, string date) =>
{
    if (!DateOnly.TryParse(date, out var d))
        return Results.BadRequest("Fecha inválida");

    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    const string sql = @"
        SELECT id, user_id, date, mood, sleep, energy, stress, notes, created_at
        FROM public.mood_checkins
        WHERE user_id = @userId AND date = @date
        ORDER BY created_at DESC
        LIMIT 1";

    await using var cmd = new NpgsqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("userId", userId);
    cmd.Parameters.AddWithValue("date", d.ToDateTime(TimeOnly.MinValue));

    await using var reader = await cmd.ExecuteReaderAsync();
    if (!await reader.ReadAsync())
        return Results.Ok(null);

    var dto = new
    {
        id = reader.GetInt64(0).ToString(),
        userId = reader.GetString(1),
        date = ((DateTime)reader["date"]).ToString("yyyy-MM-dd"),
        mood = reader.GetString(3),
        sleep = reader.GetString(4),
        energy = reader.GetString(5),
        stress = reader.GetString(6),
        notes = reader.IsDBNull(7) ? null : reader.GetString(7),
        createdAt = ((DateTime)reader["created_at"]).ToString("o")
    };

    return Results.Ok(dto);
});

app.MapPost("/checkin/submit", async (CheckInRequest body) =>
{
    if (!DateOnly.TryParse(body.date, out var d))
        return Results.BadRequest("Fecha inválida");

    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    const string sql = @"
        INSERT INTO public.mood_checkins (user_id, date, mood, sleep, energy, stress, notes)
        VALUES (@userId, @date, @mood, @sleep, @energy, @stress, @notes)
        RETURNING id, created_at;";

    await using var cmd = new NpgsqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("userId", body.userId);
    cmd.Parameters.AddWithValue("date", d.ToDateTime(TimeOnly.MinValue));
    cmd.Parameters.AddWithValue("mood", body.mood);
    cmd.Parameters.AddWithValue("sleep", body.sleep);
    cmd.Parameters.AddWithValue("energy", body.energy);
    cmd.Parameters.AddWithValue("stress", body.stress);
    cmd.Parameters.AddWithValue("notes", (object?)body.notes ?? DBNull.Value);

    await using var reader = await cmd.ExecuteReaderAsync();
    await reader.ReadAsync();
    var id = reader.GetInt64(0);
    var createdAt = (DateTime)reader["created_at"];

    return Results.Ok(new { id = id.ToString(), ts = createdAt.ToString("o") });
});

app.MapGet("/checkin/range", async (string userId, string dateFrom, string dateTo) =>
{
    if (!DateOnly.TryParse(dateFrom, out var from) || !DateOnly.TryParse(dateTo, out var to))
        return Results.BadRequest("Rango de fechas inválido");

    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    const string sql = @"
        SELECT id, user_id, date, mood, sleep, energy, stress, notes, created_at
        FROM public.mood_checkins
        WHERE user_id = @userId AND date BETWEEN @from AND @to
        ORDER BY date ASC, created_at DESC;";

    await using var cmd = new NpgsqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("userId", userId);
    cmd.Parameters.AddWithValue("from", from.ToDateTime(TimeOnly.MinValue));
    cmd.Parameters.AddWithValue("to", to.ToDateTime(TimeOnly.MinValue));

    await using var reader = await cmd.ExecuteReaderAsync();

    var list = new List<object>();
    while (await reader.ReadAsync())
    {
        list.Add(new
        {
            id = reader.GetInt64(0).ToString(),
            userId = reader.GetString(1),
            date = ((DateTime)reader["date"]).ToString("yyyy-MM-dd"),
            mood = reader.GetString(3),
            sleep = reader.GetString(4),
            energy = reader.GetString(5),
            stress = reader.GetString(6),
            notes = reader.IsDBNull(7) ? null : reader.GetString(7),
            createdAt = ((DateTime)reader["created_at"]).ToString("o")
        });
    }

    return Results.Ok(list);
});

// === Signals para el dashboard ===

app.MapGet("/signals/daily", async (string userId, string dateFrom, string dateTo) =>
{
    if (!DateOnly.TryParse(dateFrom, out var from) || !DateOnly.TryParse(dateTo, out var to))
        return Results.BadRequest("Rango de fechas inválido");

    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    const string sql = @"
        SELECT date, mood, energy, stress
        FROM (
            SELECT date, mood, energy, stress,
                   ROW_NUMBER() OVER (PARTITION BY date ORDER BY created_at DESC) AS rn
            FROM public.mood_checkins
            WHERE user_id = @userId AND date BETWEEN @from AND @to
        ) t
        WHERE rn = 1
        ORDER BY date ASC;";

    await using var cmd = new NpgsqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("userId", userId);
    cmd.Parameters.AddWithValue("from", from.ToDateTime(TimeOnly.MinValue));
    cmd.Parameters.AddWithValue("to", to.ToDateTime(TimeOnly.MinValue));

    await using var reader = await cmd.ExecuteReaderAsync();

    var list = new List<object>();
    while (await reader.ReadAsync())
    {
        var date = ((DateTime)reader["date"]).ToString("yyyy-MM-dd");
        var mood = reader.GetString(1);
        var energy = reader.GetString(2);
        var stress = reader.GetString(3);

        var facets = new Dictionary<string, object>
        {
            ["mood"] = new { value = mood, confidence = 0.9 },
            ["energy"] = new { value = energy, confidence = 0.9 },
            ["stress"] = new { value = stress, confidence = 0.9 }
        };

        list.Add(new { date, facets });
    }

    return Results.Ok(list);
});

app.MapGet("/signals/analysis", async (string userId, string dateFrom, string dateTo, AuraDbContext db) =>
{
    Guid userGuid;

    if (userId.StartsWith("aura-") && Guid.TryParse(userId.Substring(5), out var g1))
    {
        userGuid = g1;
    }
    else if (Guid.TryParse(userId, out var g2))
    {
        userGuid = g2;
    }
    else
    {
        return Results.BadRequest("userId inválido");
    }

    if (!DateOnly.TryParse(dateFrom, out var from) || !DateOnly.TryParse(dateTo, out var to))
        return Results.BadRequest("Rango de fechas inválido");

    var fromDt = from.ToDateTime(TimeOnly.MinValue);
    var toDt = to.ToDateTime(TimeOnly.MaxValue);

    var items = await (from ma in db.MessageAnalyses
                       join m in db.Messages on ma.MessageId equals m.Id
                       where ma.UserId == userGuid
                             && m.CreatedAt >= fromDt
                             && m.CreatedAt <= toDt
                       select ma.Json).ToListAsync();

    var levelsOrder = new[] { "none", "low", "medium", "high" };
    var riskSelfHarmMax = "none";
    var counts = new Dictionary<string, int>();

    foreach (var json in items)
    {
        if (string.IsNullOrWhiteSpace(json)) continue;
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.TryGetProperty("risk_self_harm", out var r))
        {
            var v = r.GetString() ?? "none";
            if (Array.IndexOf(levelsOrder, v) > Array.IndexOf(levelsOrder, riskSelfHarmMax))
                riskSelfHarmMax = v;
        }

        if (root.TryGetProperty("possible_signals", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var s in arr.EnumerateArray())
            {
                var cat = s.GetProperty("category").GetString() ?? "other";
                var lvl = s.GetProperty("level").GetString() ?? "none";
                if (lvl == "none") continue;
                var key = $"{cat}:{lvl}";
                counts[key] = counts.TryGetValue(key, out var c) ? c + 1 : 1;
            }
        }
    }

    var topCategories = counts
        .Select(kvp =>
        {
            var parts = kvp.Key.Split(':');
            return new
            {
                category = parts[0],
                level = parts[1],
                count = kvp.Value
            };
        })
        .OrderByDescending(x => x.count)
        .Take(5)
        .ToList();

    return Results.Ok(new
    {
        riskSelfHarmMax,
        topCategories
    });
});

// === Specialist panel ===

app.MapGet("/specialist/users", async (AuraDbContext db) =>
{
    var users = await db.Users.ToListAsync();

    var result = new List<SpecialistUserListItem>();

    foreach (var u in users)
    {
        var lastCheckin = await db.MoodCheckins
            .Where(x => x.UserId == u.Id)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        var lastAnalysis = await db.MessageAnalyses
            .Where(x => x.UserId == u.Id)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        string? riskSelfHarmMax = null;
        DateTimeOffset? lastAnalysisAt = null;

        if (lastAnalysis != null && !string.IsNullOrWhiteSpace(lastAnalysis.Json))
        {
            try
            {
                using var doc = JsonDocument.Parse(lastAnalysis.Json);
                if (doc.RootElement.TryGetProperty("risk_self_harm", out var rsh))
                {
                    riskSelfHarmMax = rsh.GetString();
                }
            }
            catch
            {
            }

            lastAnalysisAt = lastAnalysis.CreatedAt;
        }

        result.Add(new SpecialistUserListItem(
            u.Id,
            u.Email,
            u.DisplayName,
            u.CreatedAt,
            lastCheckin != null ? lastCheckin.Mood.ToString() : null,
            lastCheckin?.CreatedAt,
            riskSelfHarmMax,
            lastAnalysisAt
        ));
    }

    return Results.Ok(result);
}).RequireAuthorization();


app.MapGet("/specialist/users/{userId:guid}/overview", async (Guid userId, AuraDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId);
    if (user == null) return Results.NotFound();

    var from = DateTimeOffset.UtcNow.AddDays(-30);
    var to = DateTimeOffset.UtcNow;

    var moodSeries = await db.MoodCheckins
        .Where(x => x.UserId == userId && x.CreatedAt >= from && x.CreatedAt <= to)
        .OrderBy(x => x.CreatedAt)
        .Select(x => new SpecialistMoodPoint(
            x.CreatedAt,
            x.Mood
        ))
        .ToListAsync();

    var analyses = await db.MessageAnalyses
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .Take(50)
        .Select(x => new SpecialistAnalysisItem(
            x.Id,
            x.CreatedAt,
            "" 
        ))
        .ToListAsync();

    var journals = await db.JournalEntries
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .Take(50)
        .Select(x => new SpecialistJournalItem(
            x.Id,
            x.CreatedAt,
            ""
        ))
        .ToListAsync();

    var clinicalNotes = await db.ClinicalNotes
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .Take(50)
        .Select(x => new SpecialistNoteItem(
            x.Id,
            x.CreatedAt,
            x.Title,
            x.Content,
            x.Tags
        ))
        .ToListAsync();

    var overview = new SpecialistUserOverview(
        user.Id,
        user.Email,
        user.DisplayName,
        moodSeries,
        analyses,
        journals,
        clinicalNotes
    );

    return Results.Ok(overview);
}).RequireAuthorization();


app.MapPost("/specialist/users/{userId:guid}/notes", async (Guid userId, SpecialistNoteIn input, AuraDbContext db, ClaimsPrincipal principal) =>
{
    Guid specialistId;
    var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
    if (!Guid.TryParse(sub, out specialistId))
    {
        specialistId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    var note = new ClinicalNote
    {
        UserId = userId,
        SpecialistId = specialistId,
        CreatedAt = DateTimeOffset.UtcNow,
        Title = input.title,
        Content = input.content,
        Tags = input.tags
    };

    db.ClinicalNotes.Add(note);
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        note.Id,
        note.UserId,
        note.SpecialistId,
        note.CreatedAt,
        note.Title,
        note.Content,
        note.Tags
    });
}).RequireAuthorization();


app.MapPost("/specialist/users/{userId:guid}/summary", async (Guid userId, AuraDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId);
    if (user == null) return Results.NotFound();

    var from = DateTimeOffset.UtcNow.AddDays(-30);
    var to = DateTimeOffset.UtcNow;

    var moodCheckins = await db.MoodCheckins
        .Where(x => x.UserId == userId && x.CreatedAt >= from && x.CreatedAt <= to)
        .OrderBy(x => x.CreatedAt)
        .ToListAsync();

    var moodLines = moodCheckins
        .Select(x => $"{x.CreatedAt:yyyy-MM-dd}: mood={x.Mood}, note={x.Note}")
        .ToList();

    var analyses = await db.MessageAnalyses
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .Take(50)
        .ToListAsync();

    var alertLines = analyses
        .Select(a => $"{a.CreatedAt:u} | {a.Json}")
        .ToList();

    var notes = await db.ClinicalNotes
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .Take(20)
        .ToListAsync();

    var noteLines = notes
        .Select(n => $"{n.CreatedAt:u} | {n.Title}: {n.Content}")
        .ToList();

    var label = user.DisplayName ?? user.Email ?? user.Id.ToString();

    var summary = new
    {
        overview = $"Resumen preliminar para {label}.",
        mood_trend = string.Join("\n", moodLines),
        risk = "ninguno",
        key_signals = Array.Empty<string>(),
        recommendations = new[]
        {
            "Configurar y habilitar el resumen automático con la AI.",
            "Revisar los últimos check-ins y notas clínicas antes de la sesión."
        }
    };

    var json = JsonSerializer.Serialize(summary);

    return Results.Ok(new SpecialistSummaryResponse(json));
}).RequireAuthorization();


// === Journal ===

app.MapGet("/journal/list", async (string userId) =>
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    const string sql = @"
        SELECT id, text, created_at
        FROM public.journal_entries
        WHERE user_id = @userId
        ORDER BY created_at DESC;";

    await using var cmd = new NpgsqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("userId", userId);

    await using var reader = await cmd.ExecuteReaderAsync();

    var list = new List<object>();
    while (await reader.ReadAsync())
    {
        var id = reader.GetInt64(0);
        var text = reader.GetString(1);
        var ts = (DateTime)reader["created_at"];

        list.Add(new
        {
            id = id.ToString(),
            text,
            ts = ts.ToString("o")
        });
    }

    return Results.Ok(list);
});

app.MapPost("/journal/add", async (JournalAddRequest body) =>
{
    var value = body.text?.Trim();
    if (string.IsNullOrEmpty(value))
        return Results.BadRequest("Texto vacío");

    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    const string sql = @"
        INSERT INTO public.journal_entries (user_id, text)
        VALUES (@userId, @text)
        RETURNING id, created_at;";

    await using var cmd = new NpgsqlCommand(sql, conn);
    cmd.Parameters.AddWithValue("userId", body.userId);
    cmd.Parameters.AddWithValue("text", value);

    await using var reader = await cmd.ExecuteReaderAsync();
    await reader.ReadAsync();
    var id = reader.GetInt64(0);
    var ts = (DateTime)reader["created_at"];

    return Results.Ok(new { id = id.ToString(), ts = ts.ToString("o") });
});



app.MapGet("/specialist/users/{userId:guid}/overview", async (Guid userId, AuraDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(x => x.Id == userId);
    if (user == null) return Results.NotFound();

    var clinicalNotes = await db.ClinicalNotes
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt)
        .Take(50)
        .Select(x => new SpecialistNoteItem(
            x.Id,
            x.CreatedAt,
            x.Title,
            x.Content,
            x.Tags
        ))
        .ToListAsync();

    var overview = new SpecialistUserOverview(
        user.Id,
        user.Email,
        user.DisplayName,
        Enumerable.Empty<SpecialistMoodPoint>(),
        Enumerable.Empty<SpecialistAnalysisItem>(),
        Enumerable.Empty<SpecialistJournalItem>(),
        clinicalNotes
    );

    return Results.Ok(overview);
}).RequireAuthorization();



app.Run();

public record ChatSendIn(Guid conversationId, string message);
public record LoginIn(string email, string password);
public record AiReplyResponse(string reply, string? provider);
public record CheckInRequest(
    string userId,
    string date,
    string mood,
    string sleep,
    string energy,
    string stress,
    string? notes
);

public record JournalAddRequest(
    string userId,
    string text
);

public record SpecialistNoteIn(
    string title,
    string content,
    string? tags
);

public record SpecialistUserListItem(
    Guid id,
    string? email,
    string? displayName,
    DateTimeOffset createdAt,
    string? lastMood,
    DateTimeOffset? lastMoodDate,
    string? riskSelfHarmMax,
    DateTimeOffset? lastAnalysisAt
);

public record SpecialistMoodPoint(
    DateTimeOffset date,
    short mood
);

public record SpecialistAnalysisItem(
    long id,
    DateTimeOffset createdAt,
    string json
);

public record SpecialistJournalItem(
    long id,
    DateTimeOffset createdAt,
    string text
);

public record SpecialistNoteItem(
    long id,
    DateTimeOffset createdAt,
    string title,
    string content,
    string? tags
);

public record SpecialistUserOverview(
    Guid id,
    string? email,
    string? displayName,
    IEnumerable<SpecialistMoodPoint> moodSeries,
    IEnumerable<SpecialistAnalysisItem> analyses,
    IEnumerable<SpecialistJournalItem> journals,
    IEnumerable<SpecialistNoteItem> clinicalNotes
);

public record SpecialistSummaryResponse(string? summary_json);






