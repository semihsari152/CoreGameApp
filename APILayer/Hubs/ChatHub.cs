using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DomainLayer.Entities;
using DomainLayer.Enums;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;
using ApplicationLayer.Services;

namespace APILayer.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ChatHub> _logger;
        private readonly INotificationService _notificationService;

        public ChatHub(AppDbContext context, ILogger<ChatHub> logger, INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                // Kullanıcının tüm konuşmalarına katıl
                var conversationIds = await _context.ConversationParticipants
                    .Where(cp => cp.UserId == userId.Value && cp.IsActive)
                    .Select(cp => cp.ConversationId)
                    .ToListAsync();

                foreach (var conversationId in conversationIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
                }


                _logger.LogInformation($"User {userId} connected to chat with connection {Context.ConnectionId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                // Kullanıcıyı çevrimdışı yap - ancak kısa süre bekle (başka bağlantılar olabilir)
                await Task.Delay(5000); // 5 saniye bekle
                

                _logger.LogInformation($"User {userId} disconnected from chat. Connection: {Context.ConnectionId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Konuşmaya katıl
        /// </summary>
        public async Task JoinConversation(int conversationId)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            // Kullanıcının bu konuşmaya katılım yetkisi var mı kontrol et
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId.Value && cp.IsActive);

            if (participant != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
                _logger.LogInformation($"User {userId} joined conversation {conversationId}");
            }
        }

        /// <summary>
        /// Konuşmadan ayrıl
        /// </summary>
        public async Task LeaveConversation(int conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            _logger.LogInformation($"User left conversation {conversationId}");
        }

        /// <summary>
        /// Mesaj gönder
        /// </summary>
        public async Task SendMessage(int conversationId, string content, string? mediaUrl = null, string? mediaType = null, int? replyToMessageId = null)
        {
            _logger.LogInformation($"DEBUG: SendMessage called - conversationId={conversationId}, content='{content}', mediaUrl='{mediaUrl}'");
            
            var userId = GetCurrentUserId();
            if (!userId.HasValue) 
            {
                _logger.LogWarning($"DEBUG: SendMessage - No user ID found");
                return;
            }

            _logger.LogInformation($"DEBUG: SendMessage - User ID: {userId.Value}");

            // Kullanıcının bu konuşmaya mesaj gönderme yetkisi var mı kontrol et
            var participant = await _context.ConversationParticipants
                .Include(cp => cp.Conversation)
                .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId.Value && cp.IsActive);

            if (participant == null) return;

            // Direct Message konuşmalarda arkadaşlık kontrolü yap
            if (participant.Conversation.Type == ConversationType.DirectMessage)
            {
                // Konuşmadaki diğer katılımcıyı bul
                var otherParticipant = await _context.ConversationParticipants
                    .Where(cp => cp.ConversationId == conversationId && cp.UserId != userId.Value && cp.IsActive)
                    .FirstOrDefaultAsync();

                if (otherParticipant != null)
                {
                    // Arkadaşlık durumunu kontrol et
                    var friendship = await _context.Friendships
                        .FirstOrDefaultAsync(f => 
                            ((f.SenderId == userId.Value && f.ReceiverId == otherParticipant.UserId) ||
                             (f.SenderId == otherParticipant.UserId && f.ReceiverId == userId.Value)) &&
                            f.Status == FriendshipStatus.Accepted);

                    if (friendship == null)
                    {
                        _logger.LogWarning($"User {userId.Value} tried to send message to {otherParticipant.UserId} but they are not friends");
                        await Clients.Caller.SendAsync("MessageError", "Sadece arkadaşlarınızla mesajlaşabilirsiniz.");
                        return;
                    }
                }
            }

            // Mesaj tipini belirle
            var messageType = MessageType.Text;
            if (!string.IsNullOrEmpty(mediaUrl))
            {
                if (mediaType?.StartsWith("image/") == true)
                    messageType = MessageType.Image;
                else if (mediaType?.Contains("gif") == true)
                    messageType = MessageType.Gif;
                else if (mediaType?.StartsWith("video/") == true)
                    messageType = MessageType.Video;
            }

            // Mesajı oluştur
            var message = new Message
            {
                ConversationId = conversationId,
                SenderId = userId.Value,
                Content = content,
                Type = messageType,
                MediaUrl = mediaUrl,
                MediaType = mediaType,
                ReplyToMessageId = replyToMessageId,
                Status = MessageStatus.Sent,
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);

            await _context.SaveChangesAsync();

            // Konuşmanın son mesajını güncelle (mesaj kaydedildikten sonra)
            var conversation = await _context.Conversations.FindAsync(conversationId);
            if (conversation != null)
            {
                _logger.LogInformation($"DEBUG: Updating conversation {conversationId} LastMessageId from {conversation.LastMessageId} to {message.Id}");
                conversation.LastMessageId = message.Id;
                conversation.LastMessageAt = message.CreatedAt;
                conversation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation($"DEBUG: Conversation {conversationId} LastMessageId updated successfully");
            }

            // Mesajı göndereni dahil et
            var sender = await _context.Users
                .Select(u => new { u.Id, u.Username, u.AvatarUrl, u.FirstName, u.LastName })
                .FirstOrDefaultAsync(u => u.Id == userId.Value);

            // Reply mesajını dahil et (varsa)
            object? replyToMessage = null;
            if (replyToMessageId.HasValue)
            {
                var reply = await _context.Messages
                    .Include(m => m.Sender)
                    .FirstOrDefaultAsync(m => m.Id == replyToMessageId.Value);
                    
                if (reply != null)
                {
                    replyToMessage = new
                    {
                        id = reply.Id,
                        content = reply.Content,
                        mediaUrl = reply.MediaUrl,
                        sender = new
                        {
                            id = reply.Sender.Id,
                            username = reply.Sender.Username,
                            avatarUrl = reply.Sender.AvatarUrl
                        }
                    };
                }
            }

            // Mesajı konuşmadaki tüm katılımcılara gönder
            var messageData = new
            {
                id = message.Id,
                conversationId = message.ConversationId,
                content = message.Content,
                type = message.Type.ToString().ToLower(),
                mediaUrl = message.MediaUrl,
                mediaType = message.MediaType,
                replyToMessage = replyToMessage,
                sender = new
                {
                    id = sender?.Id,
                    username = sender?.Username,
                    avatarUrl = sender?.AvatarUrl,
                    displayName = !string.IsNullOrEmpty(sender?.FirstName) || !string.IsNullOrEmpty(sender?.LastName)
                        ? $"{sender?.FirstName} {sender?.LastName}".Trim()
                        : sender?.Username
                },
                createdAt = message.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                isEdited = message.IsEdited
            };

            await Clients.Group($"conversation_{conversationId}").SendAsync("ReceiveMessage", messageData);

            // Chat mesajları için bildirim oluşturulmayacak - sadece navbar'da sayı gösterilecek

            _logger.LogInformation($"Message sent by user {userId} in conversation {conversationId}");
        }

        /// <summary>
        /// Mesaj okundu olarak işaretle
        /// </summary>
        public async Task MarkMessageAsRead(int messageId)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            // Mesajın varlığını kontrol et
            var message = await _context.Messages
                .Include(m => m.Conversation)
                .ThenInclude(c => c.Participants)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null) return;

            // Kullanıcının bu konuşmada olup olmadığını kontrol et
            var participant = message.Conversation.Participants
                .FirstOrDefault(p => p.UserId == userId.Value && p.IsActive);

            if (participant == null) return;

            // Daha önce okunmuş mu kontrol et
            var existingRead = await _context.MessageReads
                .FirstOrDefaultAsync(mr => mr.MessageId == messageId && mr.UserId == userId.Value);

            if (existingRead == null)
            {
                var messageRead = new MessageRead
                {
                    MessageId = messageId,
                    UserId = userId.Value,
                    ReadAt = DateTime.UtcNow
                };

                _context.MessageReads.Add(messageRead);
                await _context.SaveChangesAsync();

                // Mesajı gönderene okundu bildirimi gönder (kendisi değilse)
                if (message.SenderId != userId.Value)
                {
                    await Clients.Group($"conversation_{message.ConversationId}")
                        .SendAsync("MessageRead", new { messageId, userId = userId.Value, readAt = messageRead.ReadAt });
                }
            }
        }

        /// <summary>
        /// Mesaja tepki ekle/kaldır
        /// </summary>
        public async Task ToggleReaction(int messageId, string emoji)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            // Mesajın varlığını kontrol et
            var message = await _context.Messages
                .Include(m => m.Conversation)
                .ThenInclude(c => c.Participants)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null) return;

            // Kullanıcının bu konuşmada olup olmadığını kontrol et
            var participant = message.Conversation.Participants
                .FirstOrDefault(p => p.UserId == userId.Value && p.IsActive);

            if (participant == null) return;

            // Mevcut tepkiyi kontrol et
            var existingReaction = await _context.MessageReactions
                .FirstOrDefaultAsync(mr => mr.MessageId == messageId && mr.UserId == userId.Value && mr.Emoji == emoji);

            if (existingReaction != null)
            {
                // Tepkiyi kaldır
                _context.MessageReactions.Remove(existingReaction);
            }
            else
            {
                // Yeni tepki ekle
                var reaction = new MessageReaction
                {
                    MessageId = messageId,
                    UserId = userId.Value,
                    Emoji = emoji,
                    CreatedAt = DateTime.UtcNow
                };

                _context.MessageReactions.Add(reaction);
            }

            await _context.SaveChangesAsync();

            // Tüm tepkileri al ve gönder
            var reactions = await _context.MessageReactions
                .Where(mr => mr.MessageId == messageId)
                .GroupBy(mr => mr.Emoji)
                .Select(g => new
                {
                    emoji = g.Key,
                    count = g.Count(),
                    users = g.Select(mr => new { userId = mr.UserId }).ToList()
                })
                .ToListAsync();

            await Clients.Group($"conversation_{message.ConversationId}")
                .SendAsync("ReactionUpdate", new { messageId, reactions });
        }

        /// <summary>
        /// Yazıyor bildirimi gönder
        /// </summary>
        public async Task SendTyping(int conversationId)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            // Kullanıcının bu konuşmada olup olmadığını kontrol et
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId.Value && cp.IsActive);

            if (participant != null)
            {
                var user = await _context.Users
                    .Select(u => new { u.Id, u.Username })
                    .FirstOrDefaultAsync(u => u.Id == userId.Value);

                await Clients.OthersInGroup($"conversation_{conversationId}")
                    .SendAsync("UserTyping", new { conversationId, userId = userId.Value, username = user?.Username });
            }
        }

        /// <summary>
        /// Yazıyor bildirimini durdur
        /// </summary>
        public async Task StopTyping(int conversationId)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return;

            await Clients.OthersInGroup($"conversation_{conversationId}")
                .SendAsync("UserStoppedTyping", new { conversationId, userId = userId.Value });
        }

        private int? GetCurrentUserId()
        {
            // Try different claim names for user ID
            var userIdClaim = Context.User?.FindFirst("userId")?.Value ?? 
                             Context.User?.FindFirst("sub")?.Value ?? 
                             Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userIdClaim != null && int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private async Task<int> GetActiveConnectionsForUser(int userId)
        {
            // SignalR connection tracking - simplified approach
            // In a real production environment, you'd use a distributed cache like Redis
            // For now, we'll assume single instance and use simple logic
            
            // Check if user has any active conversations (as a simple heuristic)
            // This is a simplified approach - ideally you'd track actual connections
            return 0; // Always return 0 for now to make disconnect immediate
        }

        /// <summary>
        /// Kullanıcı aktivitesini güncelle (heartbeat)
        /// </summary>
        public async Task UpdateActivity()
        {
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                var user = await _context.Users.FindAsync(userId.Value);
                if (user != null)
                {
                    user.LastActiveAt = DateTime.UtcNow;
                    user.IsOnline = true;
                    await _context.SaveChangesAsync();
                }
            }
        }

    }
}