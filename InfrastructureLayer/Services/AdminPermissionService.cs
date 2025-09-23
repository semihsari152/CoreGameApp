using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Repositories;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class AdminPermissionService
    {
        private readonly AdminPermissionRepository _adminPermissionRepository;
        private readonly UserAdminPermissionRepository _userAdminPermissionRepository;
        private readonly IUserRepository _userRepository;
        private readonly AuditLogService _auditLogService;
        private readonly AppDbContext _context;

        public AdminPermissionService(
            AdminPermissionRepository adminPermissionRepository,
            UserAdminPermissionRepository userAdminPermissionRepository,
            IUserRepository userRepository,
            AuditLogService auditLogService,
            AppDbContext context)
        {
            _adminPermissionRepository = adminPermissionRepository;
            _userAdminPermissionRepository = userAdminPermissionRepository;
            _userRepository = userRepository;
            _auditLogService = auditLogService;
            _context = context;
        }

        public async Task<List<AdminPermission>> GetAllPermissionsAsync()
        {
            return await _adminPermissionRepository.GetActivePermissionsAsync();
        }

        public async Task<List<AdminPermission>> GetPermissionsByCategoryAsync(string category)
        {
            return await _adminPermissionRepository.GetPermissionsByCategoryAsync(category);
        }

        public async Task<List<string>> GetPermissionCategoriesAsync()
        {
            return await _adminPermissionRepository.GetCategoriesAsync();
        }

        public async Task<List<string>> GetUserPermissionsAsync(int userId)
        {
            return await _userAdminPermissionRepository.GetUserPermissionKeysAsync(userId);
        }

        public async Task<List<UserAdminPermission>> GetUserPermissionDetailsAsync(int userId)
        {
            return await _userAdminPermissionRepository.GetUserActivePermissionsAsync(userId);
        }

        public async Task<bool> HasPermissionAsync(int userId, string permissionKey)
        {
            return await _userAdminPermissionRepository.HasPermissionAsync(userId, permissionKey);
        }

        public async Task<bool> GrantPermissionAsync(int userId, int permissionId, int grantedByUserId, string? notes = null)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            var permission = await _adminPermissionRepository.GetByIdAsync(permissionId);
            
            if (user == null || permission == null)
                return false;

            var existingPermission = await _userAdminPermissionRepository.GetUserPermissionAsync(userId, permissionId);
            
            if (existingPermission != null)
            {
                if (existingPermission.IsActive && existingPermission.RevokedAt == null)
                {
                    return true; // Kullanıcı zaten bu yetkiye sahip
                }
                
                // Revoked permission'ı yeniden aktive et
                existingPermission.IsActive = true;
                existingPermission.RevokedAt = null;
                existingPermission.RevokedByUserId = null;
                existingPermission.GrantedAt = DateTime.UtcNow;
                existingPermission.GrantedByUserId = grantedByUserId;
                existingPermission.Notes = notes;
                
                await _userAdminPermissionRepository.UpdateAsync(existingPermission);
                await _context.SaveChangesAsync();
            }
            else
            {
                // Yeni permission ver
                var userPermission = new UserAdminPermission
                {
                    UserId = userId,
                    AdminPermissionId = permissionId,
                    GrantedByUserId = grantedByUserId,
                    GrantedAt = DateTime.UtcNow,
                    IsActive = true,
                    Notes = notes
                };

                await _userAdminPermissionRepository.AddAsync(userPermission);
                await _context.SaveChangesAsync();
            }

            // Audit log kaydet
            await _auditLogService.LogAsync(
                grantedByUserId,
                "GRANT_PERMISSION",
                "UserAdminPermission",
                null,
                user.Username,
                null,
                $"{{\"permission\":\"{permission.Key}\",\"target_user\":\"{user.Username}\"}}",
                notes
            );

            return true;
        }

        public async Task<bool> RevokePermissionAsync(int userId, int permissionId, int revokedByUserId, string? notes = null)
        {
            var userPermission = await _userAdminPermissionRepository.GetUserPermissionAsync(userId, permissionId);
            
            if (userPermission == null || !userPermission.IsActive || userPermission.RevokedAt != null)
                return false;

            var user = await _userRepository.GetByIdAsync(userId);
            
            userPermission.IsActive = false;
            userPermission.RevokedAt = DateTime.UtcNow;
            userPermission.RevokedByUserId = revokedByUserId;
            if (!string.IsNullOrEmpty(notes))
            {
                userPermission.Notes = string.IsNullOrEmpty(userPermission.Notes) 
                    ? notes 
                    : $"{userPermission.Notes} | REVOKED: {notes}";
            }

            await _userAdminPermissionRepository.UpdateAsync(userPermission);
            await _context.SaveChangesAsync();

            // Audit log kaydet
            await _auditLogService.LogAsync(
                revokedByUserId,
                "REVOKE_PERMISSION",
                "UserAdminPermission",
                userPermission.Id,
                user?.Username,
                $"{{\"permission\":\"{userPermission.AdminPermission?.Key}\",\"target_user\":\"{user?.Username}\"}}",
                null,
                notes
            );

            return true;
        }

        public async Task<List<User>> GetAdminUsersAsync()
        {
            return await _userAdminPermissionRepository.GetAdminUsersAsync();
        }

        public async Task<List<UserAdminPermission>> GetUsersWithPermissionAsync(string permissionKey)
        {
            return await _userAdminPermissionRepository.GetUsersWithPermissionAsync(permissionKey);
        }

        public async Task<bool> IsUserAdminAsync(int userId)
        {
            var permissions = await _userAdminPermissionRepository.GetUserPermissionKeysAsync(userId);
            return permissions.Any(); // Herhangi bir admin yetkisi varsa admin
        }

        public async Task<bool> CanManageUsersAsync(int userId)
        {
            return await HasPermissionAsync(userId, "users.manage");
        }

        public async Task<bool> CanManageContentAsync(int userId)
        {
            return await HasPermissionAsync(userId, "content.manage");
        }

        public async Task<bool> CanManageSystemAsync(int userId)
        {
            return await HasPermissionAsync(userId, "system.manage");
        }

        public async Task<bool> CanManageAdminsAsync(int userId)
        {
            return await HasPermissionAsync(userId, "admin.manage");
        }

        /// <summary>
        /// Get user permissions with full details (for UI)
        /// </summary>
        public async Task<List<UserAdminPermission>> GetUserPermissionsWithDetailsAsync(int userId)
        {
            return await _userAdminPermissionRepository.GetUserPermissionsAsync(userId);
        }

        /// <summary>
        /// Revoke a specific user permission
        /// </summary>
        public async Task<bool> RevokeUserPermissionAsync(int userPermissionId, int revokedByUserId)
        {
            var userPermission = await _userAdminPermissionRepository.GetByIdAsync(userPermissionId);
            if (userPermission == null)
            {
                return false;
            }

            userPermission.IsActive = false;
            userPermission.RevokedAt = DateTime.UtcNow;
            userPermission.RevokedByUserId = revokedByUserId;

            await _userAdminPermissionRepository.UpdateAsync(userPermission);
            await _context.SaveChangesAsync();

            // Log the action
            await _auditLogService.LogAsync(
                revokedByUserId,
                "AdminPermissionRevoked",
                "User",
                userPermission.UserId,
                $"{{\"permission\":\"{userPermission.AdminPermission?.Key}\",\"user_permission_id\":{userPermissionId}}}"
            );

            return true;
        }
    }
}