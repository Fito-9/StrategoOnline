using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using StrategoBackend.Models.Database.Entities;
using StrategoBackend.Recursos;

namespace StrategoBackend.Models.Database
{
    public class Seeder
    {
        private readonly MyDbContext _context;

        public Seeder(MyDbContext dbContext)
        {
            _context = dbContext;
        }

        public void Seed()
        {
            User[] users =
                [
                new User {

                    Nickname = "Eldestrozaabuelas69",
                    Password = PasswordHash.Hash("kkdvak"),
                    Email = "fitoesgay@gayyy.gay"
                },
                ];
            _context.Users.AddRange(users);
            _context.SaveChanges();
        }
    }
}
