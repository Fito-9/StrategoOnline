using StrategoBackend.Models.Database.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StrategoBackend.Models.Database
{
    public interface IFriendshipRepository
    {
        Task AddFriendRequest(Friendship friendship);
        Task AcceptFriendRequest(int senderId, int receiverId);
        Task<List<User>> GetFriends(int userId);
        Task<List<Friendship>> GetPendingRequests(int userId);
    }
}