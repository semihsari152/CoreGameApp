using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class ReportDto
    {
        public int Id { get; set; }
        public int ReporterId { get; set; }
        public UserDto? Reporter { get; set; }
        public ReportableType ReportableType { get; set; }
        public int ReportableEntityId { get; set; }
        public ReportType ReportType { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ReportStatus Status { get; set; }
        public int? ReviewedByUserId { get; set; }
        public UserDto? ReviewedByUser { get; set; }
        public string? ReviewNotes { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ReviewedDate { get; set; }
        public string? Evidence { get; set; }
        
        // Reportable entity information
        public ReportableEntityInfo? ReportableEntity { get; set; }
    }

    public class ReportableEntityInfo
    {
        public string Title { get; set; } = string.Empty;
        public string? AuthorUsername { get; set; }
        public string? AuthorFullName { get; set; }
        public int? AuthorId { get; set; }
        public string? Url { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    public class CreateReportDto
    {
        public ReportableType ReportableType { get; set; }
        public int ReportableEntityId { get; set; }
        public ReportType ReportType { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Evidence { get; set; }
    }

    public class ReviewReportDto
    {
        public ReportStatus Status { get; set; }
        public string ReviewNotes { get; set; } = string.Empty;
    }

    public class UpdateReportDto
    {
        public ReportStatus? Status { get; set; }
        public string? ReviewNotes { get; set; }
        public string? AdminNote { get; set; }
    }
}