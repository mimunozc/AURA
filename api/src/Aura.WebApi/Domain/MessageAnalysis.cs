namespace Aura.WebApi.Domain;

public class MessageAnalysis
{
    public long Id { get; set; }
    public long MessageId { get; set; }
    public Guid UserId { get; set; }
    public string Json { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}
