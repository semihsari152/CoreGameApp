using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace APILayer.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private static readonly Dictionary<string, string> UserConnections = new();

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Store the connection mapping
                UserConnections[userId] = Context.ConnectionId;
                
                // Join a user-specific group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                
                Console.WriteLine($"User {userId} connected with connection {Context.ConnectionId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Remove the connection mapping
                UserConnections.Remove(userId);
                
                // Leave the user-specific group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                
                Console.WriteLine($"User {userId} disconnected");
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Client can call this to join additional groups (e.g., for specific topics)
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        // Helper method to get connection ID for a user
        public static string? GetConnectionId(string userId)
        {
            UserConnections.TryGetValue(userId, out string? connectionId);
            return connectionId;
        }

        // Helper method to check if user is online
        public static bool IsUserOnline(string userId)
        {
            return UserConnections.ContainsKey(userId);
        }

        // Get all online users
        public static IEnumerable<string> GetOnlineUsers()
        {
            return UserConnections.Keys;
        }
    }
}