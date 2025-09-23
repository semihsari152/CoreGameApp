using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface IReportService
    {
        Task<ReportDto> CreateReportAsync(int reporterId, CreateReportDto createDto);
        Task<IEnumerable<ReportDto>> GetPendingReportsAsync();
        Task<IEnumerable<ReportDto>> GetReportsByStatusAsync(ReportStatus status);
        Task<IEnumerable<ReportDto>> GetUserReportsAsync(int reporterId);
        Task<IEnumerable<ReportDto>> GetReportsForEntityAsync(ReportableType reportableType, int entityId);
        Task<ReportDto> ReviewReportAsync(int reportId, ReviewReportDto reviewDto, int reviewerId);
        Task<bool> HasUserReportedEntityAsync(int userId, ReportableType reportableType, int entityId);
        Task<int> GetPendingReportsCountAsync();
        Task<IEnumerable<ReportDto>> GetRecentReportsAsync(int count);
        
        // Admin actions
        Task ApproveReportAsync(int reportId, int reviewerId, string reviewNotes);
        Task RejectReportAsync(int reportId, int reviewerId, string reviewNotes);
        Task<ReportDto> GetReportByIdAsync(int reportId);
        
        // Additional methods needed by controller
        Task<(IEnumerable<ReportDto> data, int totalCount)> GetAllReportsAsync(object filters);
        Task<ReportDto> UpdateReportAsync(int reportId, UpdateReportDto updateDto, int reviewerId);
        Task<ReportDto> UpdateReportStatusAsync(int reportId, string status, int reviewerId);
    }
}