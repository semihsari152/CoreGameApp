using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface IFriendshipRepository : IRepository<Friendship>
    {
        Task<Friendship?> GetByUsersAsync(int senderId, int receiverId);
        Task<IEnumerable<Friendship>> GetFriendshipsAsync(int userId);
        Task<IEnumerable<Friendship>> GetFriendRequestsAsync(int userId);
        Task<IEnumerable<Friendship>> GetSentFriendRequestsAsync(int userId);
        Task<IEnumerable<User>> GetFriendsAsync(int userId);
        Task<IEnumerable<Friendship>> GetBlockedUsersAsync(int userId);
        Task<bool> AreFriendsAsync(int user1Id, int user2Id);
        Task<bool> HasPendingRequestAsync(int senderId, int receiverId);
        Task<int> GetFriendsCountAsync(int userId);
        Task<IEnumerable<Friendship>> GetUserConnectionsAsync(int userId);
    }
}