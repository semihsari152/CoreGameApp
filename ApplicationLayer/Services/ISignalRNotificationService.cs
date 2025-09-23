using DomainLayer.Entities;

namespace ApplicationLayer.Services
{
    public interface ISignalRNotificationService
    {
        /// <summary>
        /// Send a real-time notification to a specific user
        /// </summary>
        Task SendNotificationToUserAsync(int userId, Notification notification);

        /// <summary>
        /// Send a real-time notification to multiple users
        /// </summary>
        Task SendNotificationToUsersAsync(IEnumerable<int> userIds, Notification notification);

        /// <summary>
        /// Send updated unread count to a user
        /// </summary>
        Task SendUnreadCountUpdateAsync(int userId, int unreadCount);

        /// <summary>
        /// Send a system-wide notification to all connected users
        /// </summary>
        Task SendSystemNotificationAsync(string message, string? title = null);

        /// <summary>
        /// Send typing indicator for comments/chat
        /// </summary>
        Task SendTypingIndicatorAsync(int userId, string entityType, int entityId, bool isTyping);

        /// <summary>
        /// Send user online/offline status update
        /// </summary>
        Task SendOnlineStatusUpdateAsync(int userId, bool isOnline);

        /// <summary>
        /// Get list of currently online users
        /// </summary>
        Task<IEnumerable<int>> GetOnlineUsersAsync();

        /// <summary>
        /// Check if a specific user is online
        /// </summary>
        Task<bool> IsUserOnlineAsync(int userId);
    }
}