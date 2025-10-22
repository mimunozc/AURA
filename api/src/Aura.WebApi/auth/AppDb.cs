using Microsoft.EntityFrameworkCore;
using Aura.WebApi.Chat;
using Aura.WebApi.Diary;

namespace Aura.WebApi.Auth;

public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) { }

    public DbSet<User> Users => Set<User>();

    // Chat
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();

    // Diary / Mood
    public DbSet<MoodEntry> MoodEntries => Set<MoodEntry>();
}
