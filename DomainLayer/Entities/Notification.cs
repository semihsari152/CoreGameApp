using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public NotificationType Type { get; set; }
        public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ImageUrl { get; set; } // For rich notifications (user avatar, content image)
        public bool IsRead { get; set; } = false;
        public bool IsArchived { get; set; } = false;
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public string? ActionUrl { get; set; }
        public int? TriggeredByUserId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ReadDate { get; set; }
        public DateTime? ExpiryDate { get; set; } // For system notifications with expiry
        public string? Metadata { get; set; } // JSON for additional data

        public virtual User User { get; set; } = null!;
        public virtual User? TriggeredByUser { get; set; }
    }
}