using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface INotificationService
    {
        // Basic CRUD operations
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto createNotificationDto);
        Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20);
        Task<IEnumerable<NotificationDto>> GetUnreadNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task MarkAsReadAsync(int notificationId, int userId);
        Task MarkAllAsReadAsync(int userId);
        Task ArchiveNotificationAsync(int notificationId, int userId);
        Task DeleteNotificationAsync(int notificationId, int userId);

        // Smart notification creation methods
        Task NotifyLikeAsync(int targetUserId, int triggerUserId, NotificationType likeType, int entityId, string entityTitle);
        Task NotifyCommentAsync(int targetUserId, int triggerUserId, NotificationType commentType, int entityId, string entityTitle, string commentPreview);
        Task NotifyReplyAsync(int targetUserId, int triggerUserId, int commentId, int parentCommentId, string replyPreview);
        Task NotifyBestAnswerAsync(int targetUserId, int triggerUserId, int forumTopicId, string topicTitle);
        Task NotifyUserFollowedAsync(int targetUserId, int followerUserId);
        Task NotifyUserMentionedAsync(int targetUserId, int triggerUserId, int entityId, string entityType, string mentionContext);
        Task NotifyFavoriteAsync(int targetUserId, int triggerUserId, FavoriteType favoriteType, int entityId, string entityTitle);
        Task NotifyGameActivityAsync(int targetUserId, GameListType activityType, int gameId, string gameName);
        Task NotifySystemAsync(int userId, string title, string message, NotificationPriority priority = NotificationPriority.Normal);
        Task NotifyAdminAsync(int userId, string title, string message, NotificationPriority priority = NotificationPriority.High);
        Task NotifyProfileViewAsync(int profileOwnerId, int viewerUserId);
        Task NotifyCommentPinnedAsync(int commentOwnerId, int triggerUserId, int commentId, string commentContent);

        // Bulk operations
        Task NotifyMultipleUsersAsync(IEnumerable<int> userIds, CreateNotificationDto notificationDto);
        Task NotifyFollowersAsync(int userId, NotificationType type, string title, string message, string? actionUrl = null);

        // Maintenance
        Task CleanupExpiredNotificationsAsync();
        Task CleanupOldNotificationsAsync(int daysToKeep = 90);

        // Analytics
        Task<NotificationStatsDto> GetNotificationStatsAsync(int userId);

        // Legacy methods (for backward compatibility)
        Task<IEnumerable<NotificationDto>> GetRecentNotificationsAsync(int userId, int count);
        Task DeleteOldNotificationsAsync(int userId, int daysOld = 30);
        Task CreateCommentNotificationAsync(int targetUserId, int commentId, int triggeredByUserId, string entityName);
        Task CreateLikeNotificationAsync(int targetUserId, int entityId, string entityType, int triggeredByUserId);
        Task CreateForumReplyNotificationAsync(int targetUserId, int forumTopicId, int triggeredByUserId);
        Task CreateSystemNotificationAsync(int userId, string title, string message);
        Task CreateAdminNotificationAsync(int userId, string title, string message, int adminId);
    }
}