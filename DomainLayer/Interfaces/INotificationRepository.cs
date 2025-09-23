using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface INotificationRepository : IRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(int userId, bool includeRead = true);
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task<IEnumerable<Notification>> GetNotificationsByTypeAsync(int userId, NotificationType type);
        Task MarkAsReadAsync(int notificationId);
        Task MarkAllAsReadAsync(int userId);
        Task<IEnumerable<Notification>> GetRecentNotificationsAsync(int userId, int count);
        Task DeleteOldNotificationsAsync(int userId, DateTime olderThan);
    }
}