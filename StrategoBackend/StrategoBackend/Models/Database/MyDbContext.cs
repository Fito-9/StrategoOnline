using Microsoft.EntityFrameworkCore;
using StrategoBackend.Models.Database.Entities;

namespace StrategoBackend.Models.Database
{
    public class MyDbContext : DbContext
    {
        private const string DATABASE_PATH = "Stratego.db";

        public DbSet<User> Users { get; set; }
        public DbSet<Friendship> Friendships { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");
        }
    }
}