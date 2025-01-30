using StrategoBackend.Models.Database;
using StrategoBackend.Models.Database.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StrategoBackend.Services
{
    public class FriendshipService
    {
        private readonly IFriendshipRepository _friendshipRepository;

        public FriendshipService(IFriendshipRepository friendshipRepository)
        {
            _friendshipRepository = friendshipRepository;
        }

        public Task AddFriendRequest(int senderId, int receiverId)
        {
            var friendship = new Friendship { SenderId = senderId, ReceiverId = receiverId };
            return _friendshipRepository.AddFriendRequest(friendship);
        }

        public Task AcceptFriendRequest(int senderId, int receiverId)
        {
            return _friendshipRepository.AcceptFriendRequest(senderId, receiverId);
        }

        public Task<List<User>> GetFriends(int userId)
        {
            return _friendshipRepository.GetFriends(userId);
        }

        public Task<List<Friendship>> GetPendingRequests(int userId)
        {
            return _friendshipRepository.GetPendingRequests(userId);
        }

        public async Task RejectFriendRequest(int senderId, int receiverId)
        {
            await _friendshipRepository.RejectFriendRequest(senderId, receiverId);
        }



        public async Task SendFriendRequest(int senderId, int receiverId)
        {
          
            var friendship = new Friendship
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                IsAccepted = false
            };

            // Enviar solicitud de amistad utilizando el repositorio
            await _friendshipRepository.AddFriendRequest(friendship);
        }
    }
}
