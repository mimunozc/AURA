using Microsoft.EntityFrameworkCore;
using Aura.WebApi.Domain;

namespace Aura.WebApi.Infrastructure;

public class AuraDbContext : DbContext
{
    public AuraDbContext(DbContextOptions<AuraDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MoodCheckin> MoodCheckins => Set<MoodCheckin>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.HasDefaultSchema("aura");
        mb.HasPostgresExtension("vector");

        mb.Entity<User>().ToTable("users").HasKey(x => x.Id);
        mb.Entity<Session>().ToTable("sessions").HasKey(x => x.Id);
        mb.Entity<Conversation>().ToTable("conversations").HasKey(x => x.Id);

        mb.Entity<Message>(e =>
        {
            e.ToTable("messages");
            e.HasKey(x => x.Id);
            e.Property(x => x.Embedding).HasColumnType("vector(1536)");
        });

        mb.Entity<MoodCheckin>().ToTable("mood_checkins").HasKey(x => x.Id);

        mb.Entity<JournalEntry>(e =>
        {
            e.ToTable("journal_entries");
            e.HasKey(x => x.Id);
            e.Property(x => x.Embedding).HasColumnType("vector(1536)");
        });
    }
}
