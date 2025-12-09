using Microsoft.EntityFrameworkCore;
using Aura.WebApi.Domain;
using Pgvector.EntityFrameworkCore;

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
    public DbSet<MessageAnalysis> MessageAnalyses => Set<MessageAnalysis>();
    public DbSet<ClinicalNote> ClinicalNotes => Set<ClinicalNote>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.HasPostgresExtension("vector");

        mb.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
        });

        mb.Entity<Session>(e =>
        {
            e.ToTable("sessions");
            e.HasKey(x => x.Id);
        });

        mb.Entity<Conversation>(e =>
        {
            e.ToTable("conversations");
            e.HasKey(x => x.Id);
        });

        mb.Entity<Message>(e =>
        {
            e.ToTable("messages");
            e.HasKey(x => x.Id);
            e.Property(x => x.Embedding).HasColumnType("vector(1536)");
        });

        mb.Entity<MoodCheckin>(e =>
        {
            e.ToTable("mood_checkins");
            e.HasKey(x => x.Id);
        });

        mb.Entity<JournalEntry>(e =>
        {
            e.ToTable("journal_entries");
            e.HasKey(x => x.Id);
            e.Property(x => x.Embedding).HasColumnType("vector(1536)");
        });

        mb.Entity<MessageAnalysis>(e =>
        {
            e.ToTable("message_analyses");
            e.HasKey(x => x.Id);
        });
        mb.Entity<ClinicalNote>(e =>
        {
            e.ToTable("clinical_notes");
            e.HasKey(x => x.Id);
        });
    }
}
