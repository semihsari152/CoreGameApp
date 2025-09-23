using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<IEnumerable<User>> GetActiveUsersAsync();
        Task<IEnumerable<User>> GetUsersByRoleAsync(Enums.UserRole role);
        Task<bool> IsUsernameExistsAsync(string username);
        Task<bool> IsEmailExistsAsync(string email);
        Task<IEnumerable<User>> GetTopUsersByXPAsync(int count);
        Task<IEnumerable<User>> GetSuggestedFriendsAsync(int currentUserId, List<int> excludeUserIds, int limit);
        Task<IEnumerable<User>> SearchUsersAsync(string query, int currentUserId, int limit);
        Task<IEnumerable<User>> GetPopularUsersAsync(List<int> excludeUserIds, int limit);
        Task<IEnumerable<User>> GetAllUsersAsync();
    }
}