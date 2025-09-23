using DomainLayer.Entities;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class UserAdminPermissionRepository : Repository<UserAdminPermission>
    {
        private readonly AppDbContext _context;

        public UserAdminPermissionRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<UserAdminPermission>> GetUserActivePermissionsAsync(int userId)
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.AdminPermission)
                .Include(uap => uap.GrantedByUser)
                .Where(uap => uap.UserId == userId && uap.IsActive && uap.RevokedAt == null)
                .Where(uap => uap.AdminPermission.IsActive)
                .OrderBy(uap => uap.AdminPermission.Category)
                .ThenBy(uap => uap.AdminPermission.Order)
                .ToListAsync();
        }

        public async Task<List<string>> GetUserPermissionKeysAsync(int userId)
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.AdminPermission)
                .Where(uap => uap.UserId == userId && uap.IsActive && uap.RevokedAt == null)
                .Where(uap => uap.AdminPermission.IsActive)
                .Select(uap => uap.AdminPermission.Key)
                .ToListAsync();
        }

        public async Task<UserAdminPermission?> GetUserPermissionAsync(int userId, int permissionId)
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.AdminPermission)
                .Include(uap => uap.GrantedByUser)
                .Include(uap => uap.RevokedByUser)
                .FirstOrDefaultAsync(uap => uap.UserId == userId && uap.AdminPermissionId == permissionId);
        }

        public async Task<bool> HasPermissionAsync(int userId, string permissionKey)
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.AdminPermission)
                .AnyAsync(uap => uap.UserId == userId 
                    && uap.AdminPermission.Key == permissionKey 
                    && uap.IsActive 
                    && uap.RevokedAt == null
                    && uap.AdminPermission.IsActive);
        }

        public async Task<List<UserAdminPermission>> GetUsersWithPermissionAsync(string permissionKey)
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.User)
                .Include(uap => uap.AdminPermission)
                .Include(uap => uap.GrantedByUser)
                .Where(uap => uap.AdminPermission.Key == permissionKey 
                    && uap.IsActive 
                    && uap.RevokedAt == null
                    && uap.AdminPermission.IsActive)
                .OrderBy(uap => uap.User.Username)
                .ToListAsync();
        }

        public async Task<List<User>> GetAdminUsersAsync()
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.User)
                .Where(uap => uap.IsActive && uap.RevokedAt == null)
                .Select(uap => uap.User)
                .Distinct()
                .OrderBy(u => u.Username)
                .ToListAsync();
        }

        public async Task<List<UserAdminPermission>> GetUserPermissionsAsync(int userId)
        {
            return await _context.UserAdminPermissions
                .Include(uap => uap.AdminPermission)
                .Include(uap => uap.GrantedByUser)
                .Where(uap => uap.UserId == userId && uap.IsActive && uap.RevokedAt == null)
                .Where(uap => uap.AdminPermission.IsActive)
                .OrderBy(uap => uap.AdminPermission.Category)
                .ThenBy(uap => uap.AdminPermission.Order)
                .ToListAsync();
        }
    }
}