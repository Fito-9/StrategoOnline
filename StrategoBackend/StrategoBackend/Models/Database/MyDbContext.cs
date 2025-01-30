using Microsoft.EntityFrameworkCore;
using StrategoBackend.Models.Database.Entities;

namespace StrategoBackend.Models.Database
{
    public class MyDbContext : DbContext
    {
        private const string DATABASE_PATH = "Stratego.db";

        // Tablas de la base de datos
        public DbSet<User> Users { get; set; }
        public DbSet<Friendship> Friendships { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");
        }

        // Configuración de relaciones en el modelo
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Sender)
                .WithMany(u => u.SentFriendships) // Un Usuario puede ser el 'Sender' en muchas amistades
                .HasForeignKey(f => f.SenderId) // La clave foránea es SenderId
                .OnDelete(DeleteBehavior.Restrict); // Evitar eliminación en cascada

            // Configuración de la relación de clave foránea entre Friendship y User (Receiver)
            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Receiver) // Relación con el User que es el Receiver
                .WithMany(u => u.ReceivedFriendships) // Un Usuario puede ser el 'Receiver' en muchas amistades
                .HasForeignKey(f => f.ReceiverId) // La clave foránea es ReceiverId
                .OnDelete(DeleteBehavior.Restrict); // Evitar eliminación en cascada
        }
    }
}