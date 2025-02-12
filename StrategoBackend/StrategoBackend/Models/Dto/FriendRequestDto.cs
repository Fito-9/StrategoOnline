namespace StrategoBackend.Models.Dto
{
    public class FriendRequestDto
    {
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string? SenderNickname { get; set; }
        public string? SenderAvatar { get; set; }
    }
}
