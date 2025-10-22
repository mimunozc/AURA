using System;

namespace Aura.WebApi.Diary;

public record MoodIn(string Mood, string Notes, Guid? ConversationId);
public record MoodOut(Guid Id, string Mood, string Notes, DateTime CreatedAt, Guid? ConversationId);
