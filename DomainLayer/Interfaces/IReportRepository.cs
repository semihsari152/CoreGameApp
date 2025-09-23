using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface IReportRepository : IRepository<Report>
    {
        Task<IEnumerable<Report>> GetPendingReportsAsync();
        Task<IEnumerable<Report>> GetReportsByStatusAsync(ReportStatus status);
        Task<IEnumerable<Report>> GetReportsByTypeAsync(ReportType reportType);
        Task<IEnumerable<Report>> GetReportsByReportableTypeAsync(ReportableType reportableType);
        Task<IEnumerable<Report>> GetReportsForEntityAsync(ReportableType reportableType, int entityId);
        Task<IEnumerable<Report>> GetUserReportsAsync(int reporterId);
        Task<bool> HasUserReportedEntityAsync(int userId, ReportableType reportableType, int entityId);
        Task<IEnumerable<Report>> GetRecentReportsAsync(int count);
        Task<int> GetPendingReportsCountAsync();
    }
}