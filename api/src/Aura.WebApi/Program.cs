using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);

// CORS para el front
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));

// Auth (scaffold para luego proteger endpoints)
var key = builder.Configuration["Jwt:Key"] ?? "supersecretlocal";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new()
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
        };
    });
// 👇 Faltaba esto
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors();

// 👇 Orden correcto: Auth antes de Authorization
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { ok = true, service = "api" }));

var aiUrl = app.Configuration["AI:BaseUrl"] ?? "http://localhost:8000";
app.MapPost("/chat/send", async (HttpContext ctx) =>
{
    var input = await ctx.Request.ReadFromJsonAsync<ChatIn>();
    if (input is null) return Results.BadRequest();

    using var http = new HttpClient { BaseAddress = new Uri(aiUrl) };
    var res = await http.PostAsJsonAsync("/chat", input);
    var data = await res.Content.ReadFromJsonAsync<object>();
    return Results.Json(data);
});

app.Run();

record ChatIn(string? user_id, string message);
