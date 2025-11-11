namespace Aura.WebApi.Domain;
public class User
{
    public Guid Id { get; set; }
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string? PasswordHash { get; set; }
}
