using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IFollowRepository : IRepository<Follow>
    {
        Task<Follow?> GetByUsersAsync(int followerId, int followingId);
        Task<IEnumerable<Follow>> GetFollowersAsync(int userId);
        Task<IEnumerable<Follow>> GetFollowingAsync(int userId);
        Task<IEnumerable<User>> GetFollowerUsersAsync(int userId);
        Task<IEnumerable<User>> GetFollowingUsersAsync(int userId);
        Task<bool> IsFollowingAsync(int followerId, int followingId);
        Task<int> GetFollowersCountAsync(int userId);
        Task<int> GetFollowingCountAsync(int userId);
    }
}