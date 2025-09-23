using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using System.Text.Json;

namespace InfrastructureLayer.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ISignalRNotificationService _signalRService;

        public NotificationService(IUnitOfWork unitOfWork, IMapper mapper, ISignalRNotificationService signalRService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _signalRService = signalRService;
        }

        // Updated method with pagination
        public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20)
        {
            var notifications = await _unitOfWork.Notifications.FindAsync(
                n => n.UserId == userId && !n.IsArchived
            );
            
            var orderedNotifications = notifications
                .OrderByDescending(n => n.CreatedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);
                
            return _mapper.Map<IEnumerable<NotificationDto>>(orderedNotifications);
        }

        public async Task<IEnumerable<NotificationDto>> GetUnreadNotificationsAsync(int userId)
        {
            var notifications = await _unitOfWork.Notifications.GetUnreadNotificationsAsync(userId);
            return _mapper.Map<IEnumerable<NotificationDto>>(notifications);
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _unitOfWork.Notifications.GetUnreadCountAsync(userId);
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto createDto)
        {
            var notification = _mapper.Map<Notification>(createDto);
            
            await _unitOfWork.Notifications.AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            var created = await _unitOfWork.Notifications.GetByIdAsync(notification.Id);
            var result = _mapper.Map<NotificationDto>(created);

            // Send real-time notification via SignalR
            try
            {
                await _signalRService.SendNotificationToUserAsync(notification.UserId, notification);
                
                // Also send updated unread count
                var unreadCount = await GetUnreadCountAsync(notification.UserId);
                await _signalRService.SendUnreadCountUpdateAsync(notification.UserId, unreadCount);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send real-time notification: {ex.Message}");
            }

            return result;
        }

        public async Task MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _unitOfWork.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadDate = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync();

                // Send updated unread count via SignalR
                try
                {
                    var unreadCount = await GetUnreadCountAsync(userId);
                    await _signalRService.SendUnreadCountUpdateAsync(userId, unreadCount);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send unread count update: {ex.Message}");
                }
            }
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _unitOfWork.Notifications.MarkAllAsReadAsync(userId);

            // Send updated unread count via SignalR
            try
            {
                await _signalRService.SendUnreadCountUpdateAsync(userId, 0);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send unread count update: {ex.Message}");
            }
        }

        public async Task<IEnumerable<NotificationDto>> GetRecentNotificationsAsync(int userId, int count)
        {
            var notifications = await _unitOfWork.Notifications.GetRecentNotificationsAsync(userId, count);
            return _mapper.Map<IEnumerable<NotificationDto>>(notifications);
        }

        public async Task DeleteOldNotificationsAsync(int userId, int daysOld = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);
            await _unitOfWork.Notifications.DeleteOldNotificationsAsync(userId, cutoffDate);
        }

        public async Task CreateCommentNotificationAsync(int targetUserId, int commentId, int triggeredByUserId, string entityName)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.CommentOnBlogPost, // Will be determined by context
                Title = "Yeni Yorum",
                Message = $"{entityName} içeriğinize yeni bir yorum yapıldı.",
                RelatedEntityId = commentId,
                RelatedEntityType = "Comment",
                ActionUrl = $"/comments/{commentId}",
                TriggeredByUserId = triggeredByUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task CreateLikeNotificationAsync(int targetUserId, int entityId, string entityType, int triggeredByUserId)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.LikeOnBlogPost, // Will be determined by context
                Title = "İçeriğiniz Beğenildi",
                Message = $"{entityType} içeriğiniz beğenildi.",
                RelatedEntityId = entityId,
                RelatedEntityType = entityType,
                ActionUrl = $"/{entityType.ToLower()}/{entityId}",
                TriggeredByUserId = triggeredByUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task CreateForumReplyNotificationAsync(int targetUserId, int forumTopicId, int triggeredByUserId)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.CommentOnForumTopic,
                Title = "Forum Konunuza Cevap",
                Message = "Forum konunuza yeni bir cevap yazıldı.",
                RelatedEntityId = forumTopicId,
                RelatedEntityType = "ForumTopic",
                ActionUrl = $"/forum/topics/{forumTopicId}",
                TriggeredByUserId = triggeredByUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task CreateSystemNotificationAsync(int userId, string title, string message)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = userId,
                Type = NotificationType.SystemNotification,
                Title = title,
                Message = message
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task CreateAdminNotificationAsync(int userId, string title, string message, int adminId)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = userId,
                Type = NotificationType.AdminMessage,
                Title = title,
                Message = message,
                TriggeredByUserId = adminId
            };

            await CreateNotificationAsync(createDto);
        }

        // New comprehensive notification methods
        public async Task ArchiveNotificationAsync(int notificationId, int userId)
        {
            var notification = await _unitOfWork.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification != null)
            {
                notification.IsArchived = true;
                await _unitOfWork.SaveChangesAsync();
            }
        }

        public async Task DeleteNotificationAsync(int notificationId, int userId)
        {
            var notification = await _unitOfWork.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification != null)
            {
                await _unitOfWork.Notifications.DeleteAsync(notification);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        public async Task NotifyLikeAsync(int targetUserId, int triggerUserId, NotificationType likeType, int entityId, string entityTitle)
        {
            // Don't notify self
            if (targetUserId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);
            var entityTypeName = GetEntityTypeName(likeType);

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = likeType,
                Priority = NotificationPriority.Low,
                Title = entityTypeName == "User" ? "Profiliniz Beğenildi" : $"{entityTypeName} İçeriğiniz Beğenildi",
                Message = entityTypeName == "User" 
                    ? $"{triggerUser?.Username} profilinizi beğendi"
                    : $"{triggerUser?.Username} {entityTypeName.ToLower()} içeriğinizi beğendi: \"{TruncateText(entityTitle, 50)}\"",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = entityId,
                RelatedEntityType = entityTypeName,
                ActionUrl = GetEntityUrl(entityTypeName, entityId),
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyCommentAsync(int targetUserId, int triggerUserId, NotificationType commentType, int entityId, string entityTitle, string commentPreview)
        {
            // Don't notify self
            if (targetUserId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);
            var entityTypeName = GetEntityTypeName(commentType);

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = commentType,
                Priority = NotificationPriority.Normal,
                Title = $"{entityTypeName} İçeriğinize Yorum",
                Message = $"{triggerUser?.Username} {entityTypeName.ToLower()} içeriğinize yorum yaptı: \"{TruncateText(commentPreview, 80)}\"",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = entityId,
                RelatedEntityType = entityTypeName,
                ActionUrl = GetEntityUrl(entityTypeName, entityId),
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyReplyAsync(int targetUserId, int triggerUserId, int commentId, int parentCommentId, string replyPreview)
        {
            // Don't notify self
            if (targetUserId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.ReplyToComment,
                Priority = NotificationPriority.Normal,
                Title = "Yorumunuza Cevap",
                Message = $"{triggerUser?.Username} yorumunuza cevap verdi: \"{TruncateText(replyPreview, 80)}\"",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = commentId,
                RelatedEntityType = "Comment",
                ActionUrl = $"/comments/{commentId}",
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyBestAnswerAsync(int targetUserId, int triggerUserId, int forumTopicId, string topicTitle)
        {
            // Don't notify self
            if (targetUserId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.BestAnswerSelected,
                Priority = NotificationPriority.High,
                Title = "🏆 En İyi Cevap Seçildi!",
                Message = $"Tebrikler! \"{TruncateText(topicTitle, 50)}\" konusundaki cevabınız en iyi cevap seçildi.",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = forumTopicId,
                RelatedEntityType = "ForumTopic",
                ActionUrl = $"/forum/topic/{forumTopicId}",
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyUserFollowedAsync(int targetUserId, int followerUserId)
        {
            var followerUser = await _unitOfWork.Users.GetByIdAsync(followerUserId);

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.UserFollowed,
                Priority = NotificationPriority.Normal,
                Title = "Yeni Takipçi",
                Message = $"{followerUser?.Username} sizi takip etmeye başladı.",
                ImageUrl = followerUser?.AvatarUrl,
                RelatedEntityId = followerUserId,
                RelatedEntityType = "User",
                ActionUrl = $"/profile/{followerUser?.Username}",
                TriggeredByUserId = followerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyUserMentionedAsync(int targetUserId, int triggerUserId, int entityId, string entityType, string mentionContext)
        {
            // Don't notify self
            if (targetUserId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.UserMentioned,
                Priority = NotificationPriority.Normal,
                Title = "Bir İçerikte Etiketlendiniz",
                Message = $"{triggerUser?.Username} sizi bir {entityType.ToLower()}'da etiketledi: \"{TruncateText(mentionContext, 80)}\"",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = entityId,
                RelatedEntityType = entityType,
                ActionUrl = GetEntityUrl(entityType, entityId),
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyFavoriteAsync(int targetUserId, int triggerUserId, FavoriteType favoriteType, int entityId, string entityTitle)
        {
            // Don't notify self
            if (targetUserId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);
            var entityTypeName = favoriteType.ToString();

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.ContentAddedToFavorites,
                Priority = NotificationPriority.Low,
                Title = "İçeriğiniz Favorilere Eklendi",
                Message = $"{triggerUser?.Username} {entityTypeName.ToLower()} içeriğinizi favorilerine ekledi: \"{TruncateText(entityTitle, 50)}\"",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = entityId,
                RelatedEntityType = entityTypeName,
                ActionUrl = GetEntityUrl(entityTypeName, entityId),
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyGameActivityAsync(int targetUserId, GameListType activityType, int gameId, string gameName)
        {
            var activityText = activityType switch
            {
                GameListType.Oynuyorum => "oynuyorum",
                GameListType.Oynadim => "oynadım",
                GameListType.Oynayacagim => "oynayacağım",
                GameListType.Oynamadim => "oynamadım",
                GameListType.Oynamam => "oynamam",
                GameListType.Biraktim => "bıraktım",
                _ => "güncelledi"
            };

            var createDto = new CreateNotificationDto
            {
                UserId = targetUserId,
                Type = NotificationType.GameStatusChanged,
                Priority = NotificationPriority.Low,
                Title = "🎮 Oyun Durumu Güncellendi",
                Message = $"\"{gameName}\" oyununuz için durum \"{activityText}\" olarak güncellendi.",
                RelatedEntityId = gameId,
                RelatedEntityType = "Game",
                ActionUrl = $"/games/{gameId}"
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifySystemAsync(int userId, string title, string message, NotificationPriority priority = NotificationPriority.Normal)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = userId,
                Type = NotificationType.SystemNotification,
                Priority = priority,
                Title = title,
                Message = message
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyAdminAsync(int userId, string title, string message, NotificationPriority priority = NotificationPriority.High)
        {
            var createDto = new CreateNotificationDto
            {
                UserId = userId,
                Type = NotificationType.AdminMessage,
                Priority = priority,
                Title = title,
                Message = message
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyMultipleUsersAsync(IEnumerable<int> userIds, CreateNotificationDto notificationDto)
        {
            foreach (var userId in userIds)
            {
                var dto = new CreateNotificationDto
                {
                    UserId = userId,
                    Type = notificationDto.Type,
                    Priority = notificationDto.Priority,
                    Title = notificationDto.Title,
                    Message = notificationDto.Message,
                    ImageUrl = notificationDto.ImageUrl,
                    RelatedEntityId = notificationDto.RelatedEntityId,
                    RelatedEntityType = notificationDto.RelatedEntityType,
                    ActionUrl = notificationDto.ActionUrl,
                    TriggeredByUserId = notificationDto.TriggeredByUserId,
                    ExpiryDate = notificationDto.ExpiryDate,
                    Metadata = notificationDto.Metadata
                };

                await CreateNotificationAsync(dto);
            }
        }

        public async Task NotifyFollowersAsync(int userId, NotificationType type, string title, string message, string? actionUrl = null)
        {
            // This would require a followers table - for now, we'll skip implementation
            // In a full implementation, you'd get user's followers and notify them
            await Task.CompletedTask;
        }

        public async Task CleanupExpiredNotificationsAsync()
        {
            var expiredNotifications = await _unitOfWork.Notifications.FindAsync(
                n => n.ExpiryDate.HasValue && n.ExpiryDate < DateTime.UtcNow
            );

            foreach (var notification in expiredNotifications)
            {
                await _unitOfWork.Notifications.DeleteAsync(notification);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task CleanupOldNotificationsAsync(int daysToKeep = 90)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var oldNotifications = await _unitOfWork.Notifications.FindAsync(
                n => n.CreatedDate < cutoffDate && n.IsRead
            );

            foreach (var notification in oldNotifications)
            {
                await _unitOfWork.Notifications.DeleteAsync(notification);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<NotificationStatsDto> GetNotificationStatsAsync(int userId)
        {
            var notifications = await _unitOfWork.Notifications.FindAsync(n => n.UserId == userId);
            var today = DateTime.UtcNow.Date;
            var weekAgo = DateTime.UtcNow.AddDays(-7);

            var stats = new NotificationStatsDto
            {
                TotalNotifications = notifications.Count(),
                UnreadNotifications = notifications.Count(n => !n.IsRead),
                TodayNotifications = notifications.Count(n => n.CreatedDate.Date == today),
                WeekNotifications = notifications.Count(n => n.CreatedDate >= weekAgo),
                ArchivedNotifications = notifications.Count(n => n.IsArchived),
                LastNotificationDate = notifications.Any() ? notifications.Max(n => n.CreatedDate) : DateTime.MinValue,
                NotificationsByType = notifications
                    .GroupBy(n => n.Type.ToString())
                    .ToDictionary(g => g.Key, g => g.Count())
            };

            return stats;
        }

        // Helper methods
        private string GetEntityTypeName(NotificationType type)
        {
            return type switch
            {
                NotificationType.LikeOnComment => "Comment",
                NotificationType.LikeOnForumTopic => "ForumTopic",
                NotificationType.LikeOnBlogPost => "BlogPost",
                NotificationType.LikeOnGuide => "Guide",
                NotificationType.LikeOnUser => "User",
                NotificationType.CommentOnForumTopic => "ForumTopic",
                NotificationType.CommentOnBlogPost => "BlogPost",
                NotificationType.CommentOnGuide => "Guide",
                _ => "Content"
            };
        }

        private string GetEntityUrl(string entityType, int entityId)
        {
            return entityType.ToLower() switch
            {
                "forumtopic" => $"/forum/topic/{entityId}",
                "blogpost" => $"/blogs/{entityId}",
                "guide" => $"/guides/{entityId}",
                "game" => $"/games/{entityId}",
                "comment" => $"/comments/{entityId}",
                "user" => $"/profile/{entityId}",
                _ => $"/{entityType.ToLower()}/{entityId}"
            };
        }

        public async Task NotifyProfileViewAsync(int profileOwnerId, int viewerUserId)
        {
            // Don't notify self
            if (profileOwnerId == viewerUserId) return;

            // Check if already notified today for the same profile view
            var today = DateTime.UtcNow.Date;
            var existingNotifications = await _unitOfWork.Notifications.FindAsync(n => 
                n.UserId == profileOwnerId 
                && n.TriggeredByUserId == viewerUserId
                && n.Type == NotificationType.ProfileViewed
                && n.CreatedDate.Date == today);

            if (existingNotifications.Any()) return; // Already notified today

            var viewer = await _unitOfWork.Users.GetByIdAsync(viewerUserId);
            if (viewer == null) return;

            var createDto = new CreateNotificationDto
            {
                UserId = profileOwnerId,
                Type = NotificationType.ProfileViewed,
                Priority = NotificationPriority.Low,
                Title = "Profilinizi Görüntüledi",
                Message = $"{viewer.Username} profilinizi görüntüledi",
                ImageUrl = viewer.AvatarUrl,
                RelatedEntityId = viewerUserId,
                RelatedEntityType = "User",
                ActionUrl = $"/profile/{viewerUserId}",
                TriggeredByUserId = viewerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        public async Task NotifyCommentPinnedAsync(int commentOwnerId, int triggerUserId, int commentId, string commentContent)
        {
            // Don't notify self
            if (commentOwnerId == triggerUserId) return;

            var triggerUser = await _unitOfWork.Users.GetByIdAsync(triggerUserId);

            var createDto = new CreateNotificationDto
            {
                UserId = commentOwnerId,
                Type = NotificationType.CommentPinned,
                Priority = NotificationPriority.High,
                Title = "Yorumunuz Sabitlendi",
                Message = $"{triggerUser?.Username} yorumunuzu sabitledi: \"{TruncateText(commentContent, 60)}\"",
                ImageUrl = triggerUser?.AvatarUrl,
                RelatedEntityId = commentId,
                RelatedEntityType = "Comment",
                ActionUrl = $"/comments/{commentId}",
                TriggeredByUserId = triggerUserId
            };

            await CreateNotificationAsync(createDto);
        }

        private string TruncateText(string text, int maxLength)
        {
            if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
                return text;

            return text.Substring(0, maxLength - 3) + "...";
        }
    }
}