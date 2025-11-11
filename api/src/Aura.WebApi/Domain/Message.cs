using Pgvector;
namespace Aura.WebApi.Domain;

public class Message
{
    public long Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "user";
    public string Content { get; set; } = "";
    public Vector? Embedding { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
