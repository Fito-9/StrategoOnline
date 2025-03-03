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

#if DEBUG
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");


#else
            string connection = "Server=db14848.databaseasp.net; Database=db14848; Uid=db14848; Pwd=b@3R4M%a_5qN;";
            optionsBuilder.UseMySql(connection, ServerVersion.AutoDetect(connection));
#endif
        }
    }
}
