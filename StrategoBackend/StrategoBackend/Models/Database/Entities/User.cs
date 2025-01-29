using System.ComponentModel.DataAnnotations;

namespace StrategoBackend.Models.Database.Entities
{
    public class User
    {
        public int UserId { get; set; }

        [MaxLength(100)]
        public string Nickname { get; set; }

        [MaxLength(50)]
        public string Password { get; set; }

        [MaxLength(100)]
        public string Email { get; set; }

        [MaxLength(255)]
        public string? Ruta { get; set; } 
    }
}
