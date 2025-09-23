using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class Report
    {
        public int Id { get; set; }
        public int ReporterId { get; set; }
        public ReportableType ReportableType { get; set; }
        public int ReportableEntityId { get; set; }
        public ReportType ReportType { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ReportStatus Status { get; set; } = ReportStatus.Pending;
        public int? ReviewedByUserId { get; set; }
        public string? ReviewNotes { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedDate { get; set; }
        public string? Evidence { get; set; } // JSON array of evidence URLs/data

        public virtual User Reporter { get; set; } = null!;
        public virtual User? ReviewedByUser { get; set; }
    }
}