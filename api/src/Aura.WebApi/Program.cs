using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Aura.WebApi.Infrastructure;
using Aura.WebApi.Domain;      
using Pgvector.EntityFrameworkCore;    

var builder = WebApplication.CreateBuilder(args);

// Cadena de conexión (appsettings.*.json)
var cs = builder.Configuration.GetConnectionString("DefaultConnection");

// EF Core Npgsql hacia Supabase (schema "aura")
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
builder.Services.AddDbContext<AuraDbContext>(o =>
    o.UseNpgsql(cs, x => x.UseVector()));

// Swagger + CORS
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o =>
{
    o.AddPolicy("frontend", p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetIsOriginAllowed(_ => true));
});

// Auth (modo mock por defecto en dev)
var jwtKey = builder.Configuration["Auth:JwtKey"] ?? "dev-aura-change";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
var mockAuth = builder.Configuration.GetValue<bool>("Auth:Mock", true);
var mockUser = builder.Configuration["Auth:MockUser"] ?? "user@aura.cl";
var mockPass = builder.Configuration["Auth:MockPassword"] ?? "admin";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

var app = builder.Build();

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

// Health/version
app.MapGet("/health", () => Results.Ok(new { ok = true, service = "api" }));
app.MapGet("/version", () => Results.Ok(new { version = "0.1.0" }));

// --- AUTH MOCK (no toca BD; útil mientras tu tabla users no guarda PasswordHash) ---
app.MapPost("/auth/login", (string email, string password) =>
{
    if (!mockAuth) return Results.Problem("Auth real no habilitada aún");
    if ((email?.Equals(mockUser, StringComparison.OrdinalIgnoreCase) ?? false) && password == mockPass)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "00000000-0000-0000-0000-000000000001"),
            new Claim(ClaimTypes.Email, email)
        };
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));
        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return Results.Ok(new { token = jwt });
    }
    return Results.Unauthorized();
});

// --- Conversación: crear ---
app.MapPost("/chat/start", async (AuraDbContext db) =>
{
    var c = new Conversation { UserId = Guid.Parse("00000000-0000-0000-0000-000000000001") };
    db.Conversations.Add(c);
    await db.SaveChangesAsync();
    return Results.Ok(new { conversationId = c.Id });
});

// --- Conversación: enviar mensaje (persistimos mensaje user y assistant) ---
app.MapPost("/chat/send", async (AuraDbContext db, ChatSendIn input) =>
{
    // guarda mensaje del usuario
    var mUser = new Message
    {
        ConversationId = input.conversationId,
        UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
        Role = "user",
        Content = input.message
    };
    db.Messages.Add(mUser);
    await db.SaveChangesAsync();

    // respuesta provisional (aquí normalmente llamas a tu servicio de IA)
    var reply = $"Recibí: {input.message}";

    var mAssistant = new Message
    {
        ConversationId = input.conversationId,
        UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
        Role = "assistant",
        Content = reply
    };
    db.Messages.Add(mAssistant);
    await db.SaveChangesAsync();

    return Results.Ok(new { reply });
});

app.Run();

public record ChatSendIn(Guid conversationId, string message);
