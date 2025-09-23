using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using AutoMapper;
using DomainLayer.Entities;
using Microsoft.AspNetCore.SignalR;
using APILayer.Hubs;

namespace APILayer.Services
{
    public class SignalRNotificationService : ISignalRNotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IMapper _mapper;

        public SignalRNotificationService(IHubContext<NotificationHub> hubContext, IMapper mapper)
        {
            _hubContext = hubContext;
            _mapper = mapper;
        }

        public async Task SendNotificationToUserAsync(int userId, Notification notification)
        {
            try
            {
                var notificationDto = _mapper.Map<NotificationDto>(notification);
                
                // Send to specific user group
                await _hubContext.Clients.Group($"User_{userId}")
                    .SendAsync("ReceiveNotification", notificationDto);
                
                Console.WriteLine($"SignalR notification sent to user {userId}: {notification.Title}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send SignalR notification to user {userId}: {ex.Message}");
            }
        }

        public async Task SendNotificationToUsersAsync(IEnumerable<int> userIds, Notification notification)
        {
            var tasks = userIds.Select(userId => SendNotificationToUserAsync(userId, notification));
            await Task.WhenAll(tasks);
        }

        public async Task SendUnreadCountUpdateAsync(int userId, int unreadCount)
        {
            try
            {
                await _hubContext.Clients.Group($"User_{userId}")
                    .SendAsync("UnreadCountUpdated", unreadCount);
                
                Console.WriteLine($"SignalR unread count update sent to user {userId}: {unreadCount}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send SignalR unread count to user {userId}: {ex.Message}");
            }
        }

        public async Task SendSystemNotificationAsync(string message, string? title = null)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveSystemNotification", new
                {
                    Title = title ?? "Sistem Bildirimi",
                    Message = message,
                    Timestamp = DateTime.UtcNow
                });
                
                Console.WriteLine($"SignalR system notification sent: {message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send SignalR system notification: {ex.Message}");
            }
        }

        public async Task SendTypingIndicatorAsync(int userId, string entityType, int entityId, bool isTyping)
        {
            try
            {
                var groupName = $"{entityType}_{entityId}";
                var connectionId = NotificationHub.GetConnectionId(userId.ToString());
                
                if (isTyping)
                {
                    await _hubContext.Clients.GroupExcept(groupName, connectionId ?? "")
                        .SendAsync("UserTyping", new { UserId = userId, EntityType = entityType, EntityId = entityId });
                }
                else
                {
                    await _hubContext.Clients.GroupExcept(groupName, connectionId ?? "")
                        .SendAsync("UserStoppedTyping", new { UserId = userId, EntityType = entityType, EntityId = entityId });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send typing indicator: {ex.Message}");
            }
        }

        public async Task SendOnlineStatusUpdateAsync(int userId, bool isOnline)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("UserOnlineStatusChanged", new
                {
                    UserId = userId,
                    IsOnline = isOnline,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send online status update: {ex.Message}");
            }
        }

        public async Task<IEnumerable<int>> GetOnlineUsersAsync()
        {
            var onlineUserIds = NotificationHub.GetOnlineUsers()
                .Where(userId => int.TryParse(userId, out _))
                .Select(int.Parse);
            
            return onlineUserIds;
        }

        public async Task<bool> IsUserOnlineAsync(int userId)
        {
            return NotificationHub.IsUserOnline(userId.ToString());
        }
    }
}