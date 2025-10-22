using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Aura.WebApi.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Aura.WebApi.Chat;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Aura.WebApi.Diary;
using System.Linq; 



var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS (permitir front durante el dev)
builder.Services.AddCors(o =>
{
    o.AddPolicy("frontend", p =>
        p.AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()
         .SetIsOriginAllowed(_ => true)); // abrir para dev
});

// EF Core (SQLite)
builder.Services.AddDbContext<AppDb>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// JWT
var jwtKey = builder.Configuration["Auth:JwtKey"] ?? "dev-key-change";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();
// Serilog
builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration));

// HttpClient (por si lo necesitas luego)
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

// Swagger solo en Development (o siempre si prefieres)
app.UseSwagger();
app.UseSwaggerUI();

// Health y versión
app.MapGet("/healthz", () => Results.Ok(new { ok = true, service = "api" }));
app.MapGet("/version", () => Results.Ok(new { version = "0.1.0" }));

// ======== Helpers internos ========

static string Hash(string s)
{
    using var sha = SHA256.Create();
    var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(s));
    return Convert.ToHexString(bytes);
}

// ======== Endpoints de Autenticación ========

app.MapPost("/auth/register", async (AppDb db, RegisterDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        return Results.BadRequest("Email y Password requeridos.");

    var exists = await db.Users.AnyAsync(x => x.Email == dto.Email);
    if (exists) return Results.Conflict("Email ya registrado.");

    var u = new User
    {
        Email = dto.Email.Trim(),
        PasswordHash = Hash(dto.Password)
    };

    db.Users.Add(u);
    await db.SaveChangesAsync();

    return Results.Ok(new { ok = true });
});

app.MapPost("/auth/login", async (AppDb db, LoginDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        return Results.BadRequest("Email y Password requeridos.");

    var ph = Hash(dto.Password);
    var u = await db.Users.FirstOrDefaultAsync(x => x.Email == dto.Email && x.PasswordHash == ph);
    if (u == null) return Results.Unauthorized();

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
        new Claim(ClaimTypes.Email, u.Email)
    };

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));

    var jwt = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new { token = jwt });
});

app.MapPost("/chat/start", [Authorize] async (AppDb db, ClaimsPrincipal cp) =>
{
    var uid = Guid.Parse(cp.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var c = new Conversation { UserId = uid };
    db.Conversations.Add(c);
    await db.SaveChangesAsync();
    return Results.Ok(new { conversationId = c.Id });
});

app.MapPost("/chat/send", [Authorize] async (
    AppDb db,
    IConfiguration cfg,
    HttpClient http,
    ClaimsPrincipal cp,
    Guid conversationId,
    string message) =>
{
    var conv = await db.Conversations.FindAsync(conversationId);
    if (conv == null) return Results.NotFound("Conversación no existe.");

    // Guardar mensaje del usuario
    db.Messages.Add(new Message { ConversationId = conversationId, Role = "user", Text = message });
    await db.SaveChangesAsync();

    // Llamar servicio de IA
    var aiBase = cfg["Ai:BaseUrl"] ?? "http://localhost:8000";
    var aiRes = await http.PostAsJsonAsync($"{aiBase}/generate", new
    {
        user_id = cp.FindFirstValue(ClaimTypes.NameIdentifier),
        message
    });
    if (!aiRes.IsSuccessStatusCode) return Results.Problem("Error en servicio AI");

    var payload = await aiRes.Content.ReadFromJsonAsync<Dictionary<string, string>>();
    var reply = payload?["reply"] ?? "";

    // Guardar respuesta del asistente
    db.Messages.Add(new Message { ConversationId = conversationId, Role = "assistant", Text = reply });
    await db.SaveChangesAsync();

    return Results.Ok(new { reply });
});


app.MapPost("/mood", [Authorize] async (AppDb db, ClaimsPrincipal cp, MoodIn input) =>
{
    var uid = Guid.Parse(cp.FindFirstValue(ClaimTypes.NameIdentifier)!);

    Guid? cid = input.ConversationId;
    if (cid is null)
    {
        cid = await db.Conversations
            .Where(c => c.UserId == uid)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync();
    }

    var entry = new MoodEntry
    {
        UserId = uid,
        ConversationId = cid,
        Mood = input.Mood?.Trim() ?? "",
        Notes = input.Notes?.Trim() ?? ""
    };

    db.MoodEntries.Add(entry);
    await db.SaveChangesAsync();

    return Results.Ok(new { ok = true, id = entry.Id });
});

// Listar últimas entradas (por usuario, opcionalmente por conversación)
app.MapGet("/mood", [Authorize] async (AppDb db, ClaimsPrincipal cp, Guid? conversationId, int take = 30) =>
{
    var uid = Guid.Parse(cp.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var q = db.MoodEntries.AsQueryable().Where(x => x.UserId == uid);
    if (conversationId is not null) q = q.Where(x => x.ConversationId == conversationId);

    var items = await q
        .OrderByDescending(x => x.CreatedAt)
        .Take(Math.Clamp(take, 1, 200))
        .Select(x => new MoodOut(x.Id, x.Mood, x.Notes, x.CreatedAt, x.ConversationId))
        .ToListAsync();

    return Results.Ok(items);
});


app.Run();


