using System;
using Pgvector;
public class JournalEntry
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string? Title { get; set; }
    public string Content { get; set; } = "";
    public Vector? Embedding { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
