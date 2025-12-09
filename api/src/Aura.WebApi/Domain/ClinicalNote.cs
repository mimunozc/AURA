namespace Aura.WebApi.Domain;

public class ClinicalNote
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public Guid SpecialistId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string? Tags { get; set; }
}
