using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DomainLayer.Interfaces;
using DomainLayer.Entities;
using DomainLayer.Enums;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<MessageController> _logger;

        public MessageController(IUnitOfWork unitOfWork, ILogger<MessageController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        /// <summary>
        /// Kullanıcının toplam okunmamış mesaj sayısını getir
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetTotalUnreadMessageCount()
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                var conversations = await _unitOfWork.Conversations.GetUserConversationsAsync(currentUserId);
                int totalUnreadCount = 0;

                foreach (var conversation in conversations)
                {
                    var unreadCount = await _unitOfWork.Messages.GetUnreadMessageCountAsync(currentUserId, conversation.Id);
                    totalUnreadCount += unreadCount;
                }

                _logger.LogInformation($"User {currentUserId} has {totalUnreadCount} total unread messages");
                return Ok(totalUnreadCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting total unread message count for user {currentUserId}");
                return StatusCode(500, new { message = "Okunmamış mesaj sayısı getirilirken hata oluştu." });
            }
        }

        /// <summary>
        /// Konuşmadaki tüm mesajları okundu olarak işaretle
        /// </summary>
        [HttpPost("conversation/{conversationId}/mark-read")]
        public async Task<ActionResult> MarkConversationAsRead(int conversationId)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                // Kullanıcının bu konuşmaya erişimi var mı kontrol et
                if (!await _unitOfWork.Conversations.IsUserInConversationAsync(currentUserId, conversationId))
                {
                    return Forbid("Bu konuşmaya erişim yetkiniz yok.");
                }

                // Kullanıcının bu konuşmadaki LastReadAt zamanını güncelle
                var participant = await _unitOfWork.Repository<ConversationParticipant>()
                    .FirstOrDefaultAsync(cp => cp.UserId == currentUserId && cp.ConversationId == conversationId);

                if (participant != null)
                {
                    participant.LastReadAt = DateTime.UtcNow;
                    participant.UpdatedAt = DateTime.UtcNow;
                    
                    // Son mesajın ID'sini de güncelleyelim
                    var lastMessage = await _unitOfWork.Messages.GetLastMessageAsync(conversationId);
                    if (lastMessage != null)
                    {
                        participant.LastReadMessageId = lastMessage.Id;
                    }

                    _unitOfWork.Repository<ConversationParticipant>().Update(participant);
                    await _unitOfWork.SaveAsync();
                }

                var unreadMessages = await _unitOfWork.Messages.GetUnreadMessagesAsync(currentUserId, conversationId);
                var markedCount = unreadMessages.Count(m => m.SenderId != currentUserId);
                _logger.LogInformation($"User {currentUserId} marked {markedCount} messages as read in conversation {conversationId}");

                return Ok(new { message = $"{markedCount} mesaj okundu olarak işaretlendi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking conversation {conversationId} as read for user {currentUserId}");
                return StatusCode(500, new { message = "Mesajlar okundu olarak işaretlenirken hata oluştu." });
            }
        }

        /// <summary>
        /// Belirli bir mesajı sil
        /// </summary>
        [HttpDelete("{messageId}")]
        public async Task<ActionResult> DeleteMessage(int messageId)
        {
            var currentUserId = GetCurrentUserId();

            try
            {
                // Mesajın varlığını kontrol et
                var message = await _unitOfWork.Messages.GetByIdAsync(messageId);
                if (message == null)
                {
                    return NotFound("Mesaj bulunamadı.");
                }

                // Mesajın sahibi mi kontrol et
                if (message.SenderId != currentUserId)
                {
                    return Forbid("Bu mesajı silme yetkiniz yok.");
                }

                // Mesajı sil (soft delete)
                await _unitOfWork.Messages.DeleteMessageAsync(messageId);
                await _unitOfWork.SaveAsync();

                _logger.LogInformation($"User {currentUserId} deleted message {messageId}");

                return Ok(new { message = "Mesaj silindi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting message {messageId} by user {currentUserId}");
                return StatusCode(500, new { message = "Mesaj silinirken hata oluştu." });
            }
        }

        private int GetCurrentUserId()
        {
            // Try different claim types
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
                           ?? User.FindFirst("sub") 
                           ?? User.FindFirst("userId") 
                           ?? User.FindFirst("id");
            
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                _logger.LogInformation($"Found user ID from claim: {userId}");
                return userId;
            }

            // Log all available claims for debugging
            var allClaims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList();
            _logger.LogInformation($"Available claims: {System.Text.Json.JsonSerializer.Serialize(allClaims)}");
            
            // Try to get user ID from email or any other identifier
            var emailClaim = User.FindFirst(ClaimTypes.Email);
            if (emailClaim != null)
            {
                _logger.LogInformation($"Found email claim: {emailClaim.Value}");
                
                // Try to find user by email
                var user = _unitOfWork.Users.GetByEmailAsync(emailClaim.Value).Result;
                if (user != null)
                {
                    _logger.LogInformation($"Found user by email: {user.Id}");
                    return user.Id;
                }
            }
            
            _logger.LogError("Could not determine current user ID from any claim");
            throw new UnauthorizedAccessException("User ID not found in token");
        }
    }
}