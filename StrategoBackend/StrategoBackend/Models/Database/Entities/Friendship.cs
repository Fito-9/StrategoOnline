using System.ComponentModel.DataAnnotations;

namespace StrategoBackend.Models.Database.Entities
{
    public class Friendship
    {
        public int FriendshipId { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public bool IsAccepted { get; set; } = false;

        public User Sender { get; set; }
        public User Receiver { get; set; }
    }
}
