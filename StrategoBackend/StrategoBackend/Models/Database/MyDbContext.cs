using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StrategoBackend.Models.Database.Entities;

namespace StrategoBackend.Models.Database
{
    public class MyDbContext: DbContext
    {
        private const string DATABASE_PATH = "Stratego.db";


        //Tablas de la base de datos
        public DbSet<User> Users { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            optionsBuilder.UseSqlite($"DataSource={baseDir}{DATABASE_PATH}");

        }
    }
}
