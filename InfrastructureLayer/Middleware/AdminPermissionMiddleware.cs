using InfrastructureLayer.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using System.Security.Claims;

namespace InfrastructureLayer.Middleware
{
    public class AdminPermissionMiddleware
    {
        private readonly RequestDelegate _next;

        public AdminPermissionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AdminPermissionService adminPermissionService)
        {
            // Admin panel route'larını kontrol et
            var path = context.Request.Path.Value?.ToLower();
            
            // Admin panel path'leri için yetki kontrolü
            if (path?.StartsWith("/api/admin") == true)
            {
                var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Unauthorized");
                    return;
                }

                // Admin yetkisi var mı kontrol et
                var isAdmin = await adminPermissionService.IsUserAdminAsync(userId);
                if (!isAdmin)
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("Admin permission required");
                    return;
                }

                // Spesifik endpoint'ler için detaylı yetki kontrolü
                var requiredPermission = GetRequiredPermission(path, context.Request.Method);
                if (!string.IsNullOrEmpty(requiredPermission))
                {
                    var hasPermission = await adminPermissionService.HasPermissionAsync(userId, requiredPermission);
                    if (!hasPermission)
                    {
                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsync($"Permission '{requiredPermission}' required");
                        return;
                    }
                }
            }

            await _next(context);
        }

        private string? GetRequiredPermission(string path, string method)
        {
            // Path-based permission mapping
            return path switch
            {
                // User Management
                var p when p.Contains("/api/admin/users") => "users.manage",
                
                // Content Management
                var p when p.Contains("/api/admin/content") => "content.manage",
                var p when p.Contains("/api/admin/blogs") => "content.manage",
                var p when p.Contains("/api/admin/guides") => "content.manage",
                
                // Forum Management
                var p when p.Contains("/api/admin/forum") => "forum.manage",
                
                // Game Management
                var p when p.Contains("/api/admin/games") => "games.manage",
                
                // Report Management
                var p when p.Contains("/api/admin/reports") => "reports.manage",
                
                // System Management
                var p when p.Contains("/api/admin/system") => "system.manage",
                var p when p.Contains("/api/admin/cache") => "system.manage",
                var p when p.Contains("/api/admin/settings") => "system.manage",
                
                // Admin Management (Super Admin only)
                var p when p.Contains("/api/admin/permissions") => "admin.manage",
                var p when p.Contains("/api/admin/admins") => "admin.manage",
                var p when p.Contains("/api/admin/audit") => "admin.manage",
                
                // Dashboard - Tüm adminler erişebilir
                var p when p.Contains("/api/admin/dashboard") => null,
                var p when p.Contains("/api/admin/stats") => null,
                
                _ => null
            };
        }
    }

    public static class AdminPermissionMiddlewareExtensions
    {
        public static IApplicationBuilder UseAdminPermissions(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AdminPermissionMiddleware>();
        }
    }
}