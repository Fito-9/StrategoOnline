using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StrategoBackend.Models.Database.Entities
{
    public class Friendship
    {
        [Key]
        public int FriendshipId { get; set; }

        [ForeignKey("Sender")]
        public int SenderId { get; set; }

        [ForeignKey("Receiver")]
        public int ReceiverId { get; set; }

        public bool IsAccepted { get; set; } = false;

        public User Sender { get; set; }

        public User Receiver { get; set; }
    }
}
