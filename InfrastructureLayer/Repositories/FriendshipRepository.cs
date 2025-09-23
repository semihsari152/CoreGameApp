using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class FriendshipRepository : Repository<Friendship>, IFriendshipRepository
    {
        public FriendshipRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Friendship?> GetByUsersAsync(int senderId, int receiverId)
        {
            return await _context.Set<Friendship>()
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .FirstOrDefaultAsync(f => 
                    (f.SenderId == senderId && f.ReceiverId == receiverId) ||
                    (f.SenderId == receiverId && f.ReceiverId == senderId));
        }

        public async Task<IEnumerable<Friendship>> GetFriendshipsAsync(int userId)
        {
            return await _context.Set<Friendship>()
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId) && 
                           f.Status == FriendshipStatus.Accepted)
                .OrderByDescending(f => f.FriendsSince)
                .ToListAsync();
        }

        public async Task<IEnumerable<Friendship>> GetFriendRequestsAsync(int userId)
        {
            return await _context.Set<Friendship>()
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
                .OrderByDescending(f => f.RequestedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Friendship>> GetSentFriendRequestsAsync(int userId)
        {
            return await _context.Set<Friendship>()
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Where(f => f.SenderId == userId && f.Status == FriendshipStatus.Pending)
                .OrderByDescending(f => f.RequestedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetFriendsAsync(int userId)
        {
            var friendships = await _context.Set<Friendship>()
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId) && 
                           f.Status == FriendshipStatus.Accepted)
                .ToListAsync();

            return friendships.Select(f => f.SenderId == userId ? f.Receiver : f.Sender);
        }

        public async Task<IEnumerable<Friendship>> GetBlockedUsersAsync(int userId)
        {
            return await _context.Set<Friendship>()
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Where(f => f.Status == FriendshipStatus.Blocked && 
                           f.BlockedById == userId)
                .OrderByDescending(f => f.BlockedAt)
                .ToListAsync();
        }

        public async Task<bool> AreFriendsAsync(int user1Id, int user2Id)
        {
            return await _context.Set<Friendship>()
                .AnyAsync(f => ((f.SenderId == user1Id && f.ReceiverId == user2Id) ||
                               (f.SenderId == user2Id && f.ReceiverId == user1Id)) &&
                              f.Status == FriendshipStatus.Accepted);
        }

        public async Task<bool> HasPendingRequestAsync(int senderId, int receiverId)
        {
            return await _context.Set<Friendship>()
                .AnyAsync(f => f.SenderId == senderId && f.ReceiverId == receiverId && 
                              f.Status == FriendshipStatus.Pending);
        }

        public async Task<int> GetFriendsCountAsync(int userId)
        {
            return await _context.Set<Friendship>()
                .CountAsync(f => (f.SenderId == userId || f.ReceiverId == userId) && 
                                f.Status == FriendshipStatus.Accepted);
        }

        public async Task<IEnumerable<Friendship>> GetUserConnectionsAsync(int userId)
        {
            return await _context.Set<Friendship>()
                .Where(f => f.SenderId == userId || f.ReceiverId == userId)
                .ToListAsync();
        }
    }
}