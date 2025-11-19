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

app.Run();

public record ChatSendIn(Guid conversationId, string message);
public record LoginIn(string email, string password);
public record AiReplyResponse(string reply, string? provider);
