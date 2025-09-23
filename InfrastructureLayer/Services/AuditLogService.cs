using DomainLayer.Entities;
using DomainLayer.Enums;
using InfrastructureLayer.Repositories;
using Microsoft.AspNetCore.Http;

namespace InfrastructureLayer.Services
{
    public class AuditLogService
    {
        private readonly AuditLogRepository _auditLogRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditLogService(AuditLogRepository auditLogRepository, IHttpContextAccessor httpContextAccessor)
        {
            _auditLogRepository = auditLogRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(
            int userId,
            string action,
            string entityType,
            int? entityId = null,
            string? entityName = null,
            string? oldValues = null,
            string? newValues = null,
            string? notes = null,
            AuditLogLevel level = AuditLogLevel.Info)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var ipAddress = GetClientIpAddress(httpContext);
            var userAgent = httpContext?.Request.Headers["User-Agent"].FirstOrDefault();

            var auditLog = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                EntityName = entityName,
                OldValues = oldValues,
                NewValues = newValues,
                IpAddress = ipAddress ?? "Unknown",
                UserAgent = userAgent?.Length > 500 ? userAgent.Substring(0, 500) : userAgent,
                Notes = notes?.Length > 1000 ? notes.Substring(0, 1000) : notes,
                Level = level,
                Timestamp = DateTime.UtcNow
            };

            await _auditLogRepository.AddAsync(auditLog);
        }

        public async Task LogUserActionAsync(
            int userId,
            string action,
            string? notes = null,
            AuditLogLevel level = AuditLogLevel.Info)
        {
            await LogAsync(userId, action, "User", userId, null, null, null, notes, level);
        }

        public async Task LogSecurityEventAsync(
            int userId,
            string action,
            string? notes = null)
        {
            await LogAsync(userId, action, "Security", null, null, null, null, notes, AuditLogLevel.Security);
        }

        public async Task LogContentActionAsync(
            int userId,
            string action,
            string entityType,
            int entityId,
            string? entityName = null,
            string? oldValues = null,
            string? newValues = null,
            string? notes = null)
        {
            await LogAsync(userId, action, entityType, entityId, entityName, oldValues, newValues, notes, AuditLogLevel.Info);
        }

        public async Task LogSystemActionAsync(
            int userId,
            string action,
            string? notes = null)
        {
            await LogAsync(userId, action, "System", null, null, null, null, notes, AuditLogLevel.Critical);
        }

        public async Task LogAdminActionAsync(
            int userId,
            string action,
            int? targetUserId = null,
            string? targetUserName = null,
            string? notes = null)
        {
            await LogAsync(userId, action, "Admin", targetUserId, targetUserName, null, null, notes, AuditLogLevel.Critical);
        }

        public async Task<List<AuditLog>> GetRecentLogsAsync(int limit = 100)
        {
            return await _auditLogRepository.GetRecentLogsAsync(limit);
        }

        public async Task<List<AuditLog>> GetUserLogsAsync(int userId, int limit = 100)
        {
            return await _auditLogRepository.GetLogsByUserAsync(userId, limit);
        }

        public async Task<List<AuditLog>> GetEntityLogsAsync(string entityType, int? entityId = null, int limit = 100)
        {
            return await _auditLogRepository.GetLogsByEntityAsync(entityType, entityId, limit);
        }

        public async Task<List<AuditLog>> GetSecurityLogsAsync(int limit = 100)
        {
            return await _auditLogRepository.GetSecurityLogsAsync(limit);
        }

        public async Task<List<AuditLog>> GetLogsByDateRangeAsync(DateTime startDate, DateTime endDate, int limit = 1000)
        {
            return await _auditLogRepository.GetLogsByDateRangeAsync(startDate, endDate, limit);
        }

        public async Task<int> GetUserActionCountAsync(int userId, DateTime? since = null)
        {
            return await _auditLogRepository.GetLogCountByUserAsync(userId, since);
        }

        private string? GetClientIpAddress(HttpContext? httpContext)
        {
            if (httpContext == null)
                return null;

            // Try to get IP from X-Forwarded-For header (for load balancers/proxies)
            var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (ips.Length > 0)
                {
                    return ips[0].Trim();
                }
            }

            // Try to get IP from X-Real-IP header
            var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp.Trim();
            }

            // Fall back to RemoteIpAddress
            return httpContext.Connection.RemoteIpAddress?.ToString();
        }
    }
}