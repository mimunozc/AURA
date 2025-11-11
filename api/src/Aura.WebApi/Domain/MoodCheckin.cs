using System;
public class MoodCheckin
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public short Mood { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
