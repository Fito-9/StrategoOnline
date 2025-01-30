using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace StrategoBackend.Models.Database.Entities
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [MaxLength(100)]
        public string Nickname { get; set; }

        [MaxLength(50)]
        public string Password { get; set; }

        [MaxLength(100)]
        public string Email { get; set; }
        public string? Ruta { get; set; }

        [InverseProperty("Sender")]
        public ICollection<Friendship> SentFriendships { get; set; } = new List<Friendship>();

        [InverseProperty("Receiver")]
        public ICollection<Friendship> ReceivedFriendships { get; set; } = new List<Friendship>();
    }
}
