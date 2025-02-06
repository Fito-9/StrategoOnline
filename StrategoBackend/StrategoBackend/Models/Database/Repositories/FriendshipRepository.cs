    
using Microsoft.EntityFrameworkCore;
using StrategoBackend.Models.Database.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StrategoBackend.Models.Database
{
    public class FriendshipRepository : IFriendshipRepository
    {
        private readonly MyDbContext _dbContext;

        public FriendshipRepository(MyDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task AddFriendRequest(Friendship friendship)
        {
            await _dbContext.Friendships.AddAsync(friendship);
            await _dbContext.SaveChangesAsync();
        }

        public async Task AcceptFriendRequest(int senderId, int receiverId)
        {
            var friendship = await _dbContext.Friendships
                .FirstOrDefaultAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId);
            if (friendship != null)
            {
                friendship.IsAccepted = true;
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task RejectFriendRequest(int senderId, int receiverId)
        {
            var friendship = await _dbContext.Friendships
                .FirstOrDefaultAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId && !f.IsAccepted);
            if (friendship != null)
            {
                _dbContext.Friendships.Remove(friendship);
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task<List<User>> GetFriends(int userId)
        {
            return await _dbContext.Friendships
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId) && f.IsAccepted)
                .Select(f => f.SenderId == userId ? f.Receiver : f.Sender)
                .ToListAsync();
        }

        public async Task<List<Friendship>> GetPendingRequests(int userId)
        {
            // Incluir el usuario remitente para que se puedan mapear sus datos
            return await _dbContext.Friendships
                .Include(f => f.Sender)
                .Where(f => f.ReceiverId == userId && !f.IsAccepted)
                .ToListAsync();
        }
    }
}
