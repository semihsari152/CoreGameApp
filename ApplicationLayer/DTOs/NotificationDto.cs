using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public NotificationType Type { get; set; }
        public NotificationPriority Priority { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsRead { get; set; }
        public bool IsArchived { get; set; }
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public string? ActionUrl { get; set; }
        public int? TriggeredByUserId { get; set; }
        public UserDto? TriggeredByUser { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ReadDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Metadata { get; set; }
        
        // Helper properties for UI
        public string TimeAgo => GetTimeAgo();
        public string TypeIcon => GetTypeIcon();
        public string PriorityColor => GetPriorityColor();
        
        private string GetTimeAgo()
        {
            var timeSpan = DateTime.UtcNow - CreatedDate;
            if (timeSpan.TotalMinutes < 1) return "Az önce";
            if (timeSpan.TotalHours < 1) return $"{(int)timeSpan.TotalMinutes} dakika önce";
            if (timeSpan.TotalDays < 1) return $"{(int)timeSpan.TotalHours} saat önce";
            if (timeSpan.TotalDays < 7) return $"{(int)timeSpan.TotalDays} gün önce";
            return CreatedDate.ToString("dd.MM.yyyy");
        }

        private string GetTypeIcon()
        {
            return Type switch
            {
                NotificationType.LikeOnComment => "👍",
                NotificationType.LikeOnForumTopic => "👍",
                NotificationType.LikeOnBlogPost => "👍",
                NotificationType.LikeOnGuide => "👍",
                NotificationType.CommentOnForumTopic => "💬",
                NotificationType.CommentOnBlogPost => "💬",
                NotificationType.CommentOnGuide => "💬",
                NotificationType.ReplyToComment => "↩️",
                NotificationType.BestAnswerSelected => "⭐",
                NotificationType.UserFollowed => "👥",
                NotificationType.UserMentioned => "@",
                NotificationType.ContentAddedToFavorites => "❤️",
                NotificationType.GameRatingAdded => "🎮",
                NotificationType.SystemNotification => "🔔",
                NotificationType.AdminMessage => "👨‍💼",
                NotificationType.AchievementUnlocked => "🏆",
                NotificationType.LevelUp => "⬆️",
                _ => "🔔"
            };
        }

        private string GetPriorityColor()
        {
            return Priority switch
            {
                NotificationPriority.Low => "text-gray-500",
                NotificationPriority.Normal => "text-blue-500",
                NotificationPriority.High => "text-orange-500",
                NotificationPriority.Critical => "text-red-500",
                _ => "text-blue-500"
            };
        }
    }

    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public NotificationType Type { get; set; }
        public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public string? ActionUrl { get; set; }
        public int? TriggeredByUserId { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Metadata { get; set; }
    }
}