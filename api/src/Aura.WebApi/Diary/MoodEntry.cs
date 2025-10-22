namespace Aura.WebApi.Diary;

public class MoodEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    
    public Guid? ConversationId { get; set; }

    public string Mood { get; set; } = "";   
    public string Notes { get; set; } = "";  
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
