using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class ReportRepository : Repository<Report>, IReportRepository
    {
        private readonly AppDbContext _context;

        public ReportRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Report>> GetPendingReportsAsync()
        {
            return await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReviewedByUser)
                .Where(r => r.Status == ReportStatus.Pending)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Report>> GetReportsByStatusAsync(ReportStatus status)
        {
            return await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReviewedByUser)
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Report>> GetReportsByTypeAsync(ReportType reportType)
        {
            return await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReviewedByUser)
                .Where(r => r.ReportType == reportType)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Report>> GetReportsByReportableTypeAsync(ReportableType reportableType)
        {
            return await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReviewedByUser)
                .Where(r => r.ReportableType == reportableType)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Report>> GetReportsForEntityAsync(ReportableType reportableType, int entityId)
        {
            return await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReviewedByUser)
                .Where(r => r.ReportableType == reportableType && r.ReportableEntityId == entityId)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Report>> GetUserReportsAsync(int reporterId)
        {
            return await _context.Reports
                .Include(r => r.ReviewedByUser)
                .Where(r => r.ReporterId == reporterId)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<bool> HasUserReportedEntityAsync(int userId, ReportableType reportableType, int entityId)
        {
            return await _context.Reports
                .AnyAsync(r => r.ReporterId == userId 
                          && r.ReportableType == reportableType 
                          && r.ReportableEntityId == entityId);
        }

        public async Task<IEnumerable<Report>> GetRecentReportsAsync(int count)
        {
            return await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReviewedByUser)
                .OrderByDescending(r => r.CreatedDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task<int> GetPendingReportsCountAsync()
        {
            return await _context.Reports
                .CountAsync(r => r.Status == ReportStatus.Pending);
        }
    }
}