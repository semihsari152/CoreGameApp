using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Enums;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/notifications")] // Add plural route for frontend compatibility
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMyNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
                
                return Ok(new { message = "Bildirimler", data = notifications });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("unread")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUnreadNotifications()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
                
                return Ok(new { message = "Okunmamış bildirimler", data = notifications });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("unread-count")]
        [Authorize]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var count = await _notificationService.GetUnreadCountAsync(userId);
                
                return Ok(count); // Return direct value for frontend compatibility
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.MarkAsReadAsync(id, userId);
                return Ok(new { message = "Bildirim okundu olarak işaretlendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.MarkAllAsReadAsync(userId);
                
                return Ok(new { message = "Tüm bildirimler okundu olarak işaretlendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.DeleteNotificationAsync(id, userId);
                return Ok(new { message = "Bildirim silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/archive")]
        [Authorize]
        public async Task<IActionResult> ArchiveNotification(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.ArchiveNotificationAsync(id, userId);
                return Ok(new { message = "Bildirim arşivlendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("recent/{count}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetRecentNotifications(int count)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var notifications = await _notificationService.GetRecentNotificationsAsync(userId, count);
                
                return Ok(notifications); // Return direct array for frontend compatibility
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("old")]
        [Authorize]
        public async Task<IActionResult> DeleteOldNotifications([FromQuery] int daysOld = 30)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.DeleteOldNotificationsAsync(userId, daysOld);
                
                return Ok(new { message = $"{daysOld} günden eski bildirimler silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Admin endpoint to create system notifications
        [HttpPost("system")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> CreateSystemNotification([FromBody] CreateSystemNotificationDto createDto)
        {
            try
            {
                await _notificationService.CreateSystemNotificationAsync(createDto.UserId, createDto.Title, createDto.Message);
                return Ok(new { message = "Sistem bildirimi gönderildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Admin endpoint to create admin notifications
        [HttpPost("admin")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> CreateAdminNotification([FromBody] CreateAdminNotificationDto createDto)
        {
            try
            {
                var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _notificationService.CreateAdminNotificationAsync(createDto.UserId, createDto.Title, createDto.Message, adminId);
                
                return Ok(new { message = "Admin bildirimi gönderildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Stats endpoint for notification statistics
        [HttpGet("stats")]
        [Authorize]
        public async Task<ActionResult<object>> GetNotificationStats()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var unreadCount = await _notificationService.GetUnreadCountAsync(userId);
                var totalCount = (await _notificationService.GetUserNotificationsAsync(userId, 1, int.MaxValue)).Count();
                
                return Ok(new { 
                    unreadCount = unreadCount,
                    totalCount = totalCount,
                    readCount = totalCount - unreadCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    // Helper DTOs for admin notifications
    public class CreateSystemNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class CreateAdminNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}