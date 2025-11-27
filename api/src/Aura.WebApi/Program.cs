using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
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

app.MapPost("/auth/login", (LoginIn input, IConfiguration cfg) =>
{
    var mockSection = cfg.GetSection("Auth");
    var mockUser = mockSection["MockUser"] ?? "user@aura.cl";
    var mockPassword = mockSection["MockPassword"] ?? "Demo.1234";

    if (!string.Equals(input.email, mockUser, StringComparison.OrdinalIgnoreCase) ||
        input.password != mockPassword)
    {
        return Results.Unauthorized();
    }

    var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, mockUser)
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

// === Guía adaptativa (overview básico) ===

app.MapGet("/adaptive/overview", async (string userId) =>
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    long checkins = 0;
    long journals = 0;

    const string sqlCheckins = @"SELECT COUNT(*) FROM public.mood_checkins WHERE user_id = @userId;";
    const string sqlJournals = @"SELECT COUNT(*) FROM public.journal_entries WHERE user_id = @userId;";

    await using (var cmd = new NpgsqlCommand(sqlCheckins, conn))
    {
        cmd.Parameters.AddWithValue("userId", userId);
        checkins = (long)(await cmd.ExecuteScalarAsync() ?? 0L);
    }

    await using (var cmd = new NpgsqlCommand(sqlJournals, conn))
    {
        cmd.Parameters.AddWithValue("userId", userId);
        journals = (long)(await cmd.ExecuteScalarAsync() ?? 0L);
    }

    var xpTotal = (int)(checkins * 10 + journals * 5);
    var level = xpTotal / 50 + 1;
    var nextLevelXp = (level + 1) * 50;

    var profile = new
    {
        level,
        xpTotal,
        nextLevelXp
    };

    var totalSteps = 3;
    var completedSteps = checkins >= 7 ? 3 : checkins >= 3 ? 2 : checkins > 0 ? 1 : 0;
    var progress = totalSteps == 0 ? 0.0 : (double)completedSteps / totalSteps;

    var currentTrack = new
    {
        id = "getting-started",
        name = "Primeros pasos con AURA",
        description = "Crea el hábito de registrar tus emociones y reflexionar a diario.",
        progress,
        totalSteps,
        completedSteps
    };

    var achievements = new List<object>();

    if (checkins >= 1)
    {
        achievements.Add(new
        {
            code = "first_checkin",
            name = "Primer check-in",
            description = "Registraste tu primer estado emocional.",
            unlockedAt = DateTime.UtcNow.ToString("o")
        });
    }

    if (checkins >= 7)
    {
        achievements.Add(new
        {
            code = "week_streak",
            name = "Semana registrada",
            description = "Llevas al menos 7 días con registros.",
            unlockedAt = DateTime.UtcNow.ToString("o")
        });
    }

    var overview = new
    {
        profile,
        currentTrack,
        recentAchievements = achievements
    };

    return Results.Ok(overview);
});

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

