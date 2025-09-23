using InfrastructureLayer.Attributes;
using InfrastructureLayer.Services;
using DomainLayer.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize] // Sadece giriş yapmış kullanıcılar
    public class AdminController : ControllerBase
    {
        private readonly AdminPermissionService _adminPermissionService;
        private readonly AuditLogService _auditLogService;
        private readonly IUserRepository _userRepository;

        public AdminController(
            AdminPermissionService adminPermissionService,
            AuditLogService auditLogService,
            IUserRepository userRepository)
        {
            _adminPermissionService = adminPermissionService;
            _auditLogService = auditLogService;
            _userRepository = userRepository;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        /// <summary>
        /// Dashboard - Tüm adminlerin erişebileceği genel bilgiler
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<ActionResult<object>> GetDashboard()
        {
            var userId = GetCurrentUserId();
            var isAdmin = await _adminPermissionService.IsUserAdminAsync(userId);
            
            if (!isAdmin)
            {
                return Forbid("Admin permission required");
            }

            var userPermissions = await _adminPermissionService.GetUserPermissionsAsync(userId);
            
            return Ok(new
            {
                UserId = userId,
                Permissions = userPermissions,
                IsAdmin = true,
                Message = "Admin Panel Dashboard"
            });
        }

        /// <summary>
        /// Kullanıcı yetkilerini görüntüleme
        /// </summary>
        [HttpGet("permissions")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult<object>> GetPermissions()
        {
            var permissions = await _adminPermissionService.GetAllPermissionsAsync();
            var categories = await _adminPermissionService.GetPermissionCategoriesAsync();
            
            return Ok(new
            {
                Permissions = permissions,
                Categories = categories
            });
        }

        /// <summary>
        /// Belirli bir kullanıcının yetkilerini görüntüleme
        /// </summary>
        [HttpGet("users/{userId}/permissions")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult<object>> GetUserPermissions(int userId)
        {
            var permissions = await _adminPermissionService.GetUserPermissionDetailsAsync(userId);
            var permissionKeys = await _adminPermissionService.GetUserPermissionsAsync(userId);
            
            return Ok(new
            {
                UserId = userId,
                Permissions = permissions,
                PermissionKeys = permissionKeys
            });
        }

        /// <summary>
        /// Kullanıcıya yetki verme
        /// </summary>
        [HttpPost("users/{userId}/permissions/{permissionId}")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> GrantPermission(int userId, int permissionId, [FromBody] GrantPermissionRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var success = await _adminPermissionService.GrantPermissionAsync(userId, permissionId, currentUserId, request?.Notes);
            
            if (success)
            {
                return Ok(new { Message = "Permission granted successfully" });
            }
            
            return BadRequest(new { Message = "Failed to grant permission" });
        }

        /// <summary>
        /// Kullanıcının yetkisini iptal etme
        /// </summary>
        [HttpDelete("users/{userId}/permissions/{permissionId}")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> RevokePermission(int userId, int permissionId, [FromBody] RevokePermissionRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var success = await _adminPermissionService.RevokePermissionAsync(userId, permissionId, currentUserId, request?.Notes);
            
            if (success)
            {
                return Ok(new { Message = "Permission revoked successfully" });
            }
            
            return BadRequest(new { Message = "Failed to revoke permission" });
        }

        /// <summary>
        /// Admin kullanıcı listesi
        /// </summary>
        [HttpGet("admins")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult<object>> GetAdmins()
        {
            var admins = await _adminPermissionService.GetAdminUsersAsync();
            
            return Ok(new
            {
                Admins = admins,
                Count = admins.Count
            });
        }

        /// <summary>
        /// Audit log'ları görüntüleme
        /// </summary>
        [HttpGet("audit-logs")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult<object>> GetAuditLogs([FromQuery] int limit = 100)
        {
            var logs = await _auditLogService.GetRecentLogsAsync(limit);
            
            return Ok(new
            {
                Logs = logs,
                Count = logs.Count
            });
        }

        /// <summary>
        /// Güvenlik log'ları
        /// </summary>
        [HttpGet("security-logs")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult<object>> GetSecurityLogs([FromQuery] int limit = 100)
        {
            var logs = await _auditLogService.GetSecurityLogsAsync(limit);
            
            return Ok(new
            {
                SecurityLogs = logs,
                Count = logs.Count
            });
        }

        /// <summary>
        /// Belirli bir kullanıcının işlem geçmişi
        /// </summary>
        [HttpGet("users/{userId}/audit-logs")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult<object>> GetUserAuditLogs(int userId, [FromQuery] int limit = 100)
        {
            var logs = await _auditLogService.GetUserLogsAsync(userId, limit);
            var actionCount = await _auditLogService.GetUserActionCountAsync(userId);
            
            return Ok(new
            {
                UserId = userId,
                Logs = logs,
                TotalActionCount = actionCount
            });
        }

        /// <summary>
        /// Tüm kullanıcıları listele
        /// </summary>
        [HttpGet("users")]
        [RequirePermission("users.manage")]
        public async Task<ActionResult<object>> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsersAsync();
            
            return Ok(users);
        }

        /// <summary>
        /// Kullanıcı durumunu değiştir (aktif/pasif)
        /// </summary>
        [HttpPost("users/{userId}/toggle-status")]
        [RequirePermission("users.manage")]
        public async Task<ActionResult> ToggleUserStatus(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound("Kullanıcı bulunamadı");
            }

            user.IsActive = !user.IsActive;
            await _userRepository.UpdateAsync(user);

            return Ok(new { Message = $"Kullanıcı {(user.IsActive ? "aktif" : "pasif")} edildi" });
        }

        /// <summary>
        /// Kullanıcıyı sil
        /// </summary>
        [HttpDelete("users/{userId}")]
        [RequirePermission("users.manage")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            var currentUserId = GetCurrentUserId();
            if (userId == currentUserId)
            {
                return BadRequest("Kendi hesabınızı silemezsiniz");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound("Kullanıcı bulunamadı");
            }

            await _userRepository.DeleteAsync(user);

            return Ok(new { Message = "Kullanıcı silindi" });
        }

        /// <summary>
        /// Kullanıcıya admin yetkisi ver
        /// </summary>
        [HttpPost("users/{userId}/make-admin")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> MakeUserAdmin(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound("Kullanıcı bulunamadı");
            }

            user.Role = DomainLayer.Enums.UserRole.Admin;
            await _userRepository.UpdateAsync(user);

            return Ok(new { Message = "Kullanıcıya admin yetkisi verildi" });
        }

        /// <summary>
        /// Kullanıcının admin yetkisini kaldır
        /// </summary>
        [HttpPost("users/{userId}/remove-admin")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> RemoveUserAdmin(int userId)
        {
            var currentUserId = GetCurrentUserId();
            if (userId == currentUserId)
            {
                return BadRequest("Kendi admin yetkilerinizi kaldıramazsınız");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound("Kullanıcı bulunamadı");
            }

            user.Role = DomainLayer.Enums.UserRole.User;
            await _userRepository.UpdateAsync(user);

            return Ok(new { Message = "Admin yetkisi kaldırıldı" });
        }

        /// <summary>
        /// Get users with Admin or Moderator roles
        /// </summary>
        [HttpGet("privileged-users")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> GetPrivilegedUsers([FromQuery] string? roles = null)
        {
            try
            {
                var users = await _userRepository.GetAllUsersAsync();
                
                // Filter by roles if specified
                if (!string.IsNullOrEmpty(roles))
                {
                    var roleList = roles.Split(',').Select(r => r.Trim()).ToList();
                    users = users.Where(u => roleList.Contains(u.Role.ToString())).ToList();
                }
                
                // Only return Admin and Moderator users by default
                var privilegedUsers = users.Where(u => u.Role == DomainLayer.Enums.UserRole.Admin || u.Role == DomainLayer.Enums.UserRole.Moderator).ToList();

                var result = privilegedUsers.Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    Role = u.Role.ToString(),
                    Status = u.Status.ToString(),
                    u.CreatedDate,
                    u.LastLoginDate
                });

                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting users", error = ex.Message });
            }
        }

        /// <summary>
        /// Get user's admin permissions
        /// </summary>
        [HttpGet("users/{userId}/admin-permissions")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> GetUserAdminPermissions(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var userPermissions = await _adminPermissionService.GetUserPermissionsWithDetailsAsync(userId);
                
                var result = userPermissions.Select(up => new
                {
                    id = up.Id,
                    userId = up.UserId,
                    adminPermissionId = up.AdminPermissionId,
                    permission = new
                    {
                        id = up.AdminPermission.Id,
                        name = up.AdminPermission.Name,
                        key = up.AdminPermission.Key,
                        category = up.AdminPermission.Category,
                        description = up.AdminPermission.Description,
                        isActive = up.AdminPermission.IsActive,
                        order = up.AdminPermission.Order
                    },
                    grantedAt = up.GrantedAt,
                    grantedByUserId = up.GrantedByUserId,
                    grantedByUser = new
                    {
                        username = up.GrantedByUser.Username,
                        firstName = up.GrantedByUser.FirstName,
                        lastName = up.GrantedByUser.LastName
                    },
                    notes = up.Notes,
                    isActive = up.IsActive
                });

                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting user permissions", error = ex.Message });
            }
        }

        /// <summary>
        /// Grant permission to user
        /// </summary>
        [HttpPost("users/{userId}/admin-permissions")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> GrantUserPermission(int userId, [FromBody] GrantUserPermissionRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var result = await _adminPermissionService.GrantPermissionAsync(userId, request.permissionId, currentUserId, request.notes);
                
                // Log the action
                await _auditLogService.LogAsync(
                    currentUserId,
                    "PermissionGranted",
                    "AdminPermission",
                    request.permissionId,
                    $"Permission granted to user {userId}"
                );

                return Ok(new { message = "Permission granted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error granting permission", error = ex.Message });
            }
        }

        /// <summary>
        /// Update user permissions (batch operation)
        /// </summary>
        [HttpPut("users/{userId}/admin-permissions")]
        // [RequirePermission("admin.manage")] // Temporarily disable for testing
        public async Task<ActionResult> UpdateUserPermissions(int userId, [FromBody] UpdateUserPermissionsRequest request)
        {
            try
            {
                Console.WriteLine($"=== UPDATE USER PERMISSIONS CALLED === UserId: {userId}, PermissionIds: [{string.Join(",", request.permissionIds)}]");
                var currentUserId = GetCurrentUserId();
                Console.WriteLine($"=== CURRENT USER ID: {currentUserId} ===");
                
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Get current user permissions
                var currentUserPermissions = await _adminPermissionService.GetUserPermissionsWithDetailsAsync(userId);
                var currentPermissionIds = currentUserPermissions.Select(up => up.AdminPermissionId).ToHashSet();
                
                var requestedPermissionIds = request.permissionIds.ToHashSet();

                // Add new permissions
                foreach (var permissionId in requestedPermissionIds.Except(currentPermissionIds))
                {
                    Console.WriteLine($"=== GRANTING PERMISSION: {permissionId} ===");
                    var result = await _adminPermissionService.GrantPermissionAsync(userId, permissionId, currentUserId, "Updated via admin panel");
                    Console.WriteLine($"=== GRANT RESULT: {result} ===");
                }

                // Remove revoked permissions
                foreach (var permission in currentUserPermissions.Where(up => !requestedPermissionIds.Contains(up.AdminPermissionId)))
                {
                    await _adminPermissionService.RevokeUserPermissionAsync(permission.Id, currentUserId);
                }

                // Log the action
                await _auditLogService.LogAsync(
                    currentUserId,
                    "PermissionsUpdated",
                    "AdminPermission",
                    userId,
                    $"User permissions updated - {requestedPermissionIds.Count} permissions active"
                );

                return Ok(new { message = "Permissions updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating permissions", error = ex.Message });
            }
        }

        /// <summary>
        /// Revoke permission from user
        /// </summary>
        [HttpDelete("users/{userId}/admin-permissions/{userPermissionId}")]
        [RequirePermission("admin.manage")]
        public async Task<ActionResult> RevokeUserPermission(int userId, int userPermissionId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                await _adminPermissionService.RevokeUserPermissionAsync(userPermissionId, currentUserId);
                
                // Log the action
                await _auditLogService.LogAsync(
                    currentUserId,
                    "PermissionRevoked",
                    "AdminPermission",
                    userPermissionId,
                    $"Permission revoked from user {userId}"
                );

                return Ok(new { message = "Permission revoked successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error revoking permission", error = ex.Message });
            }
        }
    }

    public class GrantPermissionRequest
    {
        public string? Notes { get; set; }
    }

    public class RevokePermissionRequest
    {
        public string? Notes { get; set; }
    }

    public class GrantUserPermissionRequest
    {
        public int permissionId { get; set; }
        public string? notes { get; set; }
    }

    public class UpdateUserPermissionsRequest
    {
        public List<int> permissionIds { get; set; } = new();
    }
}