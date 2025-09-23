using DomainLayer.Entities;
using DomainLayer.Enums;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class AuditLogRepository : Repository<AuditLog>
    {
        private readonly AppDbContext _context;

        public AuditLogRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<AuditLog>> GetRecentLogsAsync(int limit = 100)
        {
            return await _context.AuditLogs
                .Include(al => al.User)
                .OrderByDescending(al => al.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetLogsByUserAsync(int userId, int limit = 100)
        {
            return await _context.AuditLogs
                .Include(al => al.User)
                .Where(al => al.UserId == userId)
                .OrderByDescending(al => al.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetLogsByEntityAsync(string entityType, int? entityId = null, int limit = 100)
        {
            var query = _context.AuditLogs
                .Include(al => al.User)
                .Where(al => al.EntityType == entityType);

            if (entityId.HasValue)
            {
                query = query.Where(al => al.EntityId == entityId.Value);
            }

            return await query
                .OrderByDescending(al => al.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetLogsByLevelAsync(AuditLogLevel level, int limit = 100)
        {
            return await _context.AuditLogs
                .Include(al => al.User)
                .Where(al => al.Level == level)
                .OrderByDescending(al => al.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetLogsByDateRangeAsync(DateTime startDate, DateTime endDate, int limit = 1000)
        {
            return await _context.AuditLogs
                .Include(al => al.User)
                .Where(al => al.Timestamp >= startDate && al.Timestamp <= endDate)
                .OrderByDescending(al => al.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetSecurityLogsAsync(int limit = 100)
        {
            return await _context.AuditLogs
                .Include(al => al.User)
                .Where(al => al.Level == AuditLogLevel.Security)
                .OrderByDescending(al => al.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<int> GetLogCountByUserAsync(int userId, DateTime? startDate = null)
        {
            var query = _context.AuditLogs.Where(al => al.UserId == userId);
            
            if (startDate.HasValue)
            {
                query = query.Where(al => al.Timestamp >= startDate.Value);
            }

            return await query.CountAsync();
        }
    }
}