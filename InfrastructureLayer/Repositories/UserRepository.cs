using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetActiveUsersAsync()
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetUsersByRoleAsync(UserRole role)
        {
            return await _context.Users
                .Where(u => u.Role == role)
                .ToListAsync();
        }

        public async Task<bool> IsUsernameExistsAsync(string username)
        {
            return await _context.Users
                .AnyAsync(u => u.Username == username);
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetTopUsersByXPAsync(int count)
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .OrderByDescending(u => u.XP)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetSuggestedFriendsAsync(int currentUserId, List<int> excludeUserIds, int limit)
        {
            // Öneri algoritması: Seviye yakınlığı ve aktivite durumuna göre
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null) return new List<User>();

            var levelRange = Math.Max(1, currentUser.Level - 2); // -2 ile +2 seviye arası
            var maxLevel = currentUser.Level + 2;

            return await _context.Users
                .Where(u => u.IsActive && 
                           u.Id != currentUserId && 
                           !excludeUserIds.Contains(u.Id) &&
                           u.Level >= levelRange && u.Level <= maxLevel)
                .OrderByDescending(u => u.XP) // En yüksek XP'liler önce
                .ThenByDescending(u => u.LastLoginDate) // En son aktif olanlar
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> SearchUsersAsync(string query, int currentUserId, int limit)
        {
            var searchTerm = query.ToLower();
            
            return await _context.Users
                .Where(u => u.IsActive && 
                           u.Id != currentUserId &&
                           (u.Username.ToLower().Contains(searchTerm) ||
                            (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                            (u.LastName != null && u.LastName.ToLower().Contains(searchTerm))))
                .OrderByDescending(u => u.Username.ToLower().StartsWith(searchTerm)) // Tam eşleşenler önce
                .ThenByDescending(u => u.Level) // Sonra seviye
                .ThenBy(u => u.Username) // Sonra alfabetik
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetPopularUsersAsync(List<int> excludeUserIds, int limit)
        {
            return await _context.Users
                .Where(u => u.IsActive && !excludeUserIds.Contains(u.Id))
                .OrderByDescending(u => u.Level) // En yüksek seviye
                .ThenByDescending(u => u.XP) // En yüksek XP
                .ThenByDescending(u => u.LastLoginDate) // En son aktif
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .OrderByDescending(u => u.CreatedDate)
                .ToListAsync();
        }
    }
}