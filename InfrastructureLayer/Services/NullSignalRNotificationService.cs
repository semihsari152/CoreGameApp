using ApplicationLayer.Services;
using DomainLayer.Entities;

namespace InfrastructureLayer.Services
{
    /// <summary>
    /// Null implementation of SignalR service for layers that don't have access to SignalR
    /// </summary>
    public class NullSignalRNotificationService : ISignalRNotificationService
    {
        public Task SendNotificationToUserAsync(int userId, Notification notification)
        {
            // No-op implementation
            return Task.CompletedTask;
        }

        public Task SendNotificationToUsersAsync(IEnumerable<int> userIds, Notification notification)
        {
            // No-op implementation
            return Task.CompletedTask;
        }

        public Task SendUnreadCountUpdateAsync(int userId, int unreadCount)
        {
            // No-op implementation
            return Task.CompletedTask;
        }

        public Task SendSystemNotificationAsync(string message, string? title = null)
        {
            // No-op implementation
            return Task.CompletedTask;
        }

        public Task SendTypingIndicatorAsync(int userId, string entityType, int entityId, bool isTyping)
        {
            // No-op implementation
            return Task.CompletedTask;
        }

        public Task SendOnlineStatusUpdateAsync(int userId, bool isOnline)
        {
            // No-op implementation
            return Task.CompletedTask;
        }

        public Task<IEnumerable<int>> GetOnlineUsersAsync()
        {
            return Task.FromResult(Enumerable.Empty<int>());
        }

        public Task<bool> IsUserOnlineAsync(int userId)
        {
            return Task.FromResult(false);
        }
    }
}