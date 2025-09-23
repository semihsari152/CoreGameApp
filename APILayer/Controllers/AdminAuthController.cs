using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InfrastructureLayer.Services;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/admin/auth")]
    public class AdminAuthController : ControllerBase
    {
        private readonly AdminPermissionService _adminPermissionService;
        private readonly AuditLogService _auditLogService;

        public AdminAuthController(
            AdminPermissionService adminPermissionService,
            AuditLogService auditLogService)
        {
            _adminPermissionService = adminPermissionService;
            _auditLogService = auditLogService;
        }

        [HttpPost("verify")]
        [Authorize]
        public async Task<ActionResult<AdminUserInfo>> VerifyAdmin()
        {
            try
            {
                var userIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "Invalid token" });
                }

                // Admin yetkisi kontrolü
                var isAdmin = await _adminPermissionService.IsUserAdminAsync(userId);
                if (!isAdmin)
                {
                    return Forbid("Admin access required");
                }

                // Kullanıcı yetkilerini getir
                var permissions = await _adminPermissionService.GetUserPermissionsAsync(userId);
                var permissionDetails = await _adminPermissionService.GetUserPermissionDetailsAsync(userId);

                var usernameClaim = User?.FindFirst(ClaimTypes.Name)?.Value ?? "Admin";
                var emailClaim = User?.FindFirst(ClaimTypes.Email)?.Value ?? "";

                var adminUser = new AdminUserInfo
                {
                    Id = userId,
                    Username = usernameClaim,
                    Email = emailClaim,
                    IsAdmin = true,
                    Permissions = permissions,
                    PermissionDetails = permissionDetails.Select(p => new AdminPermissionInfo
                    {
                        Id = p.AdminPermission.Id,
                        Name = p.AdminPermission.Name,
                        Key = p.AdminPermission.Key,
                        Category = p.AdminPermission.Category,
                        GrantedAt = p.GrantedAt,
                        GrantedBy = p.GrantedByUser?.Username
                    }).ToList()
                };

                return Ok(adminUser);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Internal server error during verification" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var userIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out var userId))
                {
                    // Logout işlemini logla
                    await _auditLogService.LogSecurityEventAsync(
                        userId,
                        "ADMIN_LOGOUT",
                        "Admin logged out successfully"
                    );
                }

                return Ok(new { Message = "Logout successful" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Internal server error during logout" });
            }
        }
    }

    // Response DTOs
    public class AdminUserInfo
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsAdmin { get; set; }
        public List<string> Permissions { get; set; } = new();
        public List<AdminPermissionInfo> PermissionDetails { get; set; } = new();
    }

    public class AdminPermissionInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime GrantedAt { get; set; }
        public string? GrantedBy { get; set; }
    }
}