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
    public class ConversationController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<ConversationController> _logger;

        public ConversationController(IUnitOfWork unitOfWork, ILogger<ConversationController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        /// <summary>
        /// Debug: List all users
        /// </summary>
        [HttpGet("debug-users")]
        public async Task<ActionResult> DebugUsers()
        {
            try
            {
                var allUsers = await _unitOfWork.Users.GetAllAsync();
                var userList = allUsers.Select(u => new {
                    id = u.Id,
                    username = u.Username,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    email = u.Email,
                    isActive = u.IsActive
                }).ToList();

                return Ok(new { users = userList, count = userList.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
            }
        }

        /// <summary>
        /// Auth test endpoint
        /// </summary>
        [HttpGet("auth-test")]
        public ActionResult AuthTest()
        {
            try
            {
                var authHeader = Request.Headers.Authorization.FirstOrDefault();
                _logger.LogInformation($"Auth test - Authorization header: {authHeader}");
                
                var currentUserId = GetCurrentUserId();
                _logger.LogInformation($"Auth test - Current user ID: {currentUserId}");
                
                var userClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                _logger.LogInformation($"Auth test - User claims: {System.Text.Json.JsonSerializer.Serialize(userClaims)}");
                
                return Ok(new { 
                    message = "Auth test successful", 
                    userId = currentUserId,
                    authHeader = authHeader,
                    isAuthenticated = User.Identity?.IsAuthenticated == true,
                    claims = userClaims
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auth test failed");
                return StatusCode(500, new { message = "Auth test failed", error = ex.Message });
            }
        }

        /// <summary>
        /// Kullanıcının tüm konuşmalarını getir
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetConversations()
        {
            var currentUserId = GetCurrentUserId();
            _logger.LogInformation($"Getting conversations for user: {currentUserId}");

            var conversations = await _unitOfWork.Conversations.GetUserConversationsAsync(currentUserId);
            _logger.LogInformation($"DEBUG: Found {conversations.Count()} conversations for user {currentUserId}");

            var conversationList = new List<object>();
            
            foreach (var conversation in conversations)
            {
                var unreadCount = await _unitOfWork.Messages.GetUnreadMessageCountAsync(currentUserId, conversation.Id);
                _logger.LogInformation($"DEBUG: Conversation {conversation.Id}: LastMessageId={conversation.LastMessageId}, LastMessage={conversation.LastMessage?.Id}, LastMessage.Content={conversation.LastMessage?.Content}");
                
                conversationList.Add(new
                {
                    id = conversation.Id,
                    type = conversation.Type.ToString().ToLower(),
                    title = GetConversationTitle(conversation, currentUserId),
                    description = conversation.Description,
                    groupImageUrl = conversation.GroupImageUrl,
                    participants = conversation.Participants.Where(p => p.IsActive).Select(p => new
                    {
                        id = p.User.Id,
                        username = p.User.Username,
                        firstName = p.User.FirstName,
                        lastName = p.User.LastName,
                        avatarUrl = p.User.AvatarUrl,
                        role = p.Role.ToString().ToLower(),
                        joinedAt = p.JoinedAt
                    }).ToList(),
                    lastMessage = conversation.LastMessage != null ? new
                    {
                        id = conversation.LastMessage.Id,
                        content = conversation.LastMessage.Content,
                        type = conversation.LastMessage.Type.ToString().ToLower(),
                        mediaUrl = conversation.LastMessage.MediaUrl,
                        sender = new
                        {
                            id = conversation.LastMessage.Sender.Id,
                            username = conversation.LastMessage.Sender.Username,
                            avatarUrl = conversation.LastMessage.Sender.AvatarUrl
                        },
                        createdAt = conversation.LastMessage.CreatedAt
                    } : null,
                    unreadCount = unreadCount,
                    lastMessageAt = conversation.LastMessageAt,
                    createdAt = conversation.CreatedAt
                });
            }
            
            var sortedList = conversationList.OrderByDescending(c => ((dynamic)c).lastMessageAt ?? ((dynamic)c).createdAt);

            return Ok(sortedList);
        }

        /// <summary>
        /// Belirli bir konuşmayı getir
        /// </summary>
        [HttpGet("{conversationId}")]
        public async Task<ActionResult> GetConversation(int conversationId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            var currentUserId = GetCurrentUserId();

            // Kullanıcının bu konuşmaya erişimi var mı kontrol et
            if (!await _unitOfWork.Conversations.IsUserInConversationAsync(currentUserId, conversationId))
            {
                return Forbid("Bu konuşmaya erişim yetkiniz yok.");
            }

            var conversation = await _unitOfWork.Conversations.GetConversationWithMessagesAsync(conversationId, skip, take);
            if (conversation == null)
            {
                return NotFound("Konuşma bulunamadı.");
            }

            var result = new
            {
                id = conversation.Id,
                type = conversation.Type.ToString().ToLower(),
                title = GetConversationTitle(conversation, currentUserId),
                description = conversation.Description,
                groupImageUrl = conversation.GroupImageUrl,
                participants = conversation.Participants.Where(p => p.IsActive).Select(p => new
                {
                    id = p.User.Id,
                    username = p.User.Username,
                    firstName = p.User.FirstName,
                    lastName = p.User.LastName,
                    avatarUrl = p.User.AvatarUrl,
                    role = p.Role.ToString().ToLower(),
                    joinedAt = p.JoinedAt
                }).ToList(),
                messages = conversation.Messages.Where(m => !m.IsDeleted).OrderBy(m => m.CreatedAt).Select(message => new
                {
                    id = message.Id,
                    content = message.Content,
                    type = message.Type.ToString().ToLower(),
                    mediaUrl = message.MediaUrl,
                    mediaType = message.MediaType,
                    sender = new
                    {
                        id = message.Sender.Id,
                        username = message.Sender.Username,
                        firstName = message.Sender.FirstName,
                        lastName = message.Sender.LastName,
                        avatarUrl = message.Sender.AvatarUrl
                    },
                    replyToMessage = message.ReplyToMessage != null ? new
                    {
                        id = message.ReplyToMessage.Id,
                        content = message.ReplyToMessage.Content,
                        mediaUrl = message.ReplyToMessage.MediaUrl,
                        sender = new
                        {
                            id = message.ReplyToMessage.Sender.Id,
                            username = message.ReplyToMessage.Sender.Username,
                            avatarUrl = message.ReplyToMessage.Sender.AvatarUrl
                        }
                    } : null,
                    reactions = message.Reactions.GroupBy(r => r.Emoji).Select(g => new
                    {
                        emoji = g.Key,
                        count = g.Count(),
                        users = g.Select(r => new { userId = r.User.Id, username = r.User.Username }).ToList()
                    }).ToList(),
                    isEdited = message.IsEdited,
                    createdAt = message.CreatedAt,
                    editedAt = message.EditedAt
                }).ToList(),
                createdAt = conversation.CreatedAt
            };

            return Ok(result);
        }

        /// <summary>
        /// Direkt mesaj konuşması başlat veya mevcut konuşmayı getir
        /// </summary>
        [HttpPost("direct/{userId}")]
        public async Task<ActionResult> StartDirectMessage(int userId)
        {
            try
            {
                _logger.LogInformation($"StartDirectMessage called with userId: {userId}");
                
                var currentUserId = GetCurrentUserId();
                _logger.LogInformation($"Current user ID: {currentUserId}");
                
                // Current user'ın varlığını kontrol et
                var currentUser = await _unitOfWork.Users.GetByIdAsync(currentUserId);
                if (currentUser == null)
                {
                    _logger.LogError($"Current user with ID {currentUserId} not found in database");
                    return NotFound("Mevcut kullanıcı bulunamadı.");
                }
                _logger.LogInformation($"Current user found: {currentUser.Username}");
                
                if (currentUserId == userId)
                {
                    return BadRequest("Kendinle konuşma başlatamazsın.");
                }

                // Hedef kullanıcının varlığını kontrol et
                var targetUser = await _unitOfWork.Users.GetByIdAsync(userId);
                if (targetUser == null)
                {
                    _logger.LogError($"Target user with ID {userId} not found in database");
                    return NotFound("Kullanıcı bulunamadı.");
                }
                _logger.LogInformation($"Target user found: {targetUser.Username}");

                // Arkadaşlık durumunu kontrol et (sadece arkadaşlar mesajlaşabilir)
                var friendship = await _unitOfWork.Friendships.GetByUsersAsync(currentUserId, userId);
                if (friendship == null || friendship.Status != FriendshipStatus.Accepted)
                {
                    _logger.LogWarning($"User {currentUserId} tried to start conversation with {userId} but they are not friends");
                    return Forbid("Sadece arkadaşlarınızla mesajlaşabilirsiniz.");
                }
                _logger.LogInformation($"Friendship verified between users {currentUserId} and {userId}");

                // Mevcut direkt mesaj konuşması var mı kontrol et
                var existingConversation = await _unitOfWork.Conversations.GetDirectMessageConversationAsync(currentUserId, userId);
                if (existingConversation != null)
                {
                    return Ok(new { conversationId = existingConversation.Id, message = "Mevcut konuşma bulundu." });
                }

                // Yeni direkt mesaj konuşması oluştur
                _logger.LogInformation($"Creating new conversation between users {currentUserId} and {userId}");
                var conversation = new Conversation
                {
                    Type = ConversationType.DirectMessage,
                    CreatedById = currentUserId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _logger.LogInformation($"Adding conversation to database...");
                await _unitOfWork.Conversations.AddAsync(conversation);
                _logger.LogInformation($"Saving conversation...");
                await _unitOfWork.SaveAsync();
                _logger.LogInformation($"Conversation saved successfully with ID: {conversation.Id}");

                // Katılımcıları ekle
                var participants = new[]
                {
                    new ConversationParticipant
                    {
                        ConversationId = conversation.Id,
                        UserId = currentUserId,
                        Role = ParticipantRole.Member,
                        JoinedAt = DateTime.UtcNow,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new ConversationParticipant
                    {
                        ConversationId = conversation.Id,
                        UserId = userId,
                        Role = ParticipantRole.Member,
                        JoinedAt = DateTime.UtcNow,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                foreach (var participant in participants)
                {
                    await _unitOfWork.Repository<ConversationParticipant>().AddAsync(participant);
                }

                await _unitOfWork.SaveAsync();

                _logger.LogInformation($"Direct message conversation created between users {currentUserId} and {userId}");

                return Ok(new { conversationId = conversation.Id, message = "Yeni konuşma başlatıldı." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in StartDirectMessage for userId: {userId}");
                return StatusCode(500, new { message = "Konuşma başlatılırken hata oluştu.", error = ex.Message });
            }
        }

        /// <summary>
        /// Grup konuşması oluştur
        /// </summary>
        [HttpPost("group")]
        public async Task<ActionResult> CreateGroupConversation([FromBody] CreateGroupConversationRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest("Grup adı gerekli.");
            }

            if (request.ParticipantIds == null || request.ParticipantIds.Count < 1)
            {
                return BadRequest("En az 1 katılımcı gerekli.");
            }

            // Katılımcıların varlığını kontrol et
            var userCount = 0;
            foreach (var participantId in request.ParticipantIds)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(participantId);
                if (user != null) userCount++;
            }
            
            if (userCount != request.ParticipantIds.Count)
            {
                return BadRequest("Bazı kullanıcılar bulunamadı.");
            }

            // Grup konuşması oluştur
            var conversation = new Conversation
            {
                Type = ConversationType.GroupChat,
                Title = request.Title,
                Description = request.Description,
                GroupImageUrl = request.GroupImageUrl,
                CreatedById = currentUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Conversations.AddAsync(conversation);
            await _unitOfWork.SaveAsync();

            // Grup sahibini ekle
            var ownerParticipant = new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = currentUserId,
                Role = ParticipantRole.Owner,
                JoinedAt = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<ConversationParticipant>().AddAsync(ownerParticipant);

            // Diğer katılımcıları ekle
            foreach (var participantId in request.ParticipantIds.Where(id => id != currentUserId))
            {
                var participant = new ConversationParticipant
                {
                    ConversationId = conversation.Id,
                    UserId = participantId,
                    Role = ParticipantRole.Member,
                    JoinedAt = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _unitOfWork.Repository<ConversationParticipant>().AddAsync(participant);
            }

            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"Group conversation '{request.Title}' created by user {currentUserId}");

            return Ok(new { conversationId = conversation.Id, message = "Grup konuşması oluşturuldu." });
        }

        /// <summary>
        /// Gruba katılımcı ekle
        /// </summary>
        [HttpPost("{conversationId}/participants")]
        public async Task<ActionResult> AddParticipant(int conversationId, [FromBody] AddParticipantRequest request)
        {
            var currentUserId = GetCurrentUserId();

            // Konuşmanın varlığını kontrol et (tüm katılımcıları dahil et)
            var conversation = await _unitOfWork.Conversations.GetConversationWithAllParticipantsAsync(conversationId);
            if (conversation == null)
            {
                return NotFound("Konuşma bulunamadı.");
            }

            if (conversation.Type != ConversationType.GroupChat)
            {
                return BadRequest("Sadece grup konuşmalarına katılımcı ekleyebilirsiniz.");
            }

            // Kullanıcının yetki kontrolü (sadece Owner ve Admin)
            var currentParticipant = conversation.Participants
                .FirstOrDefault(p => p.UserId == currentUserId && p.IsActive);

            if (currentParticipant == null ||
                (currentParticipant.Role != ParticipantRole.Owner && currentParticipant.Role != ParticipantRole.Admin))
            {
                return Forbid("Katılımcı ekleme yetkiniz yok.");
            }

            // Eklenecek kullanıcının varlığını kontrol et
            var userToAdd = await _unitOfWork.Users.GetByIdAsync(request.UserId);
            if (userToAdd == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            // Kullanıcı zaten katılımcı mı kontrol et
            var existingParticipant = conversation.Participants
                .FirstOrDefault(p => p.UserId == request.UserId);

            _logger.LogInformation($"Found {conversation.Participants.Count} total participants for conversation {conversationId}");
            _logger.LogInformation($"Looking for user {request.UserId}. Existing participant found: {existingParticipant != null}");
            
            if (existingParticipant != null)
            {
                _logger.LogInformation($"Existing participant - IsActive: {existingParticipant.IsActive}, LeftAt: {existingParticipant.LeftAt}");
            }

            if (existingParticipant != null && existingParticipant.IsActive)
            {
                return BadRequest("Kullanıcı zaten bu konuşmada.");
            }

            if (existingParticipant != null && !existingParticipant.IsActive)
            {
                // Eski katılımcıyı yeniden aktif et
                existingParticipant.IsActive = true;
                existingParticipant.JoinedAt = DateTime.UtcNow;
                existingParticipant.LeftAt = null;
                existingParticipant.UpdatedAt = DateTime.UtcNow;

                _unitOfWork.Repository<ConversationParticipant>().Update(existingParticipant);
                
                _logger.LogInformation($"Reactivated existing participant {request.UserId} in conversation {conversationId}");
            }
            else
            {
                // Yeni katılımcı ekle
                var participant = new ConversationParticipant
                {
                    ConversationId = conversationId,
                    UserId = request.UserId,
                    Role = ParticipantRole.Member,
                    JoinedAt = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Repository<ConversationParticipant>().AddAsync(participant);
            }

            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {request.UserId} added to conversation {conversationId} by user {currentUserId}");

            return Ok(new { message = "Katılımcı eklendi." });
        }

        /// <summary>
        /// Konuşmadan ayrıl
        /// </summary>
        [HttpDelete("{conversationId}/leave")]
        public async Task<ActionResult> LeaveConversation(int conversationId)
        {
            var currentUserId = GetCurrentUserId();

            // Konuşmanın varlığını kontrol et
            var conversation = await _unitOfWork.Conversations.GetConversationWithParticipantsAsync(conversationId);
            if (conversation == null)
            {
                return NotFound("Konuşma bulunamadı.");
            }

            var participant = conversation.Participants
                .FirstOrDefault(p => p.UserId == currentUserId && p.IsActive);

            if (participant == null)
            {
                return NotFound("Bu konuşmada değilsiniz.");
            }

            if (conversation.Type == ConversationType.DirectMessage)
            {
                return BadRequest("Direkt mesaj konuşmasından ayrılamazsınız.");
            }

            // Grup sahibi ayrılıyorsa liderliği devret
            if (participant.Role == ParticipantRole.Owner)
            {
                var activeParticipants = conversation.Participants.Where(p => p.IsActive && p.UserId != currentUserId).ToList();
                
                if (activeParticipants.Any())
                {
                    // Önce admin'lere bak, yoksa en eski üyeye liderliği devret
                    var newOwner = activeParticipants.FirstOrDefault(p => p.Role == ParticipantRole.Admin) 
                                  ?? activeParticipants.OrderBy(p => p.JoinedAt).First();

                    newOwner.Role = ParticipantRole.Owner;
                    newOwner.UpdatedAt = DateTime.UtcNow;
                    
                    await _unitOfWork.Repository<ConversationParticipant>().UpdateAsync(newOwner);

                    _logger.LogInformation($"Group ownership transferred from user {currentUserId} to user {newOwner.UserId} in conversation {conversationId}");
                }
                else
                {
                    // Eğer başka aktif üye yoksa grubu dağıt
                    conversation.IsActive = false;
                    conversation.UpdatedAt = DateTime.UtcNow;
                    await _unitOfWork.Repository<Conversation>().UpdateAsync(conversation);

                    _logger.LogInformation($"Group {conversationId} dissolved as owner {currentUserId} was the last member");
                }
            }

            // Normal katılımcı ayrılma
            participant.IsActive = false;
            participant.LeftAt = DateTime.UtcNow;
            participant.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<ConversationParticipant>().UpdateAsync(participant);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {currentUserId} left conversation {conversationId}");

            return Ok(new { message = "Konuşmadan ayrıldınız." });
        }

        /// <summary>
        /// Gruptan katılımcı at (sadece grup sahibi)
        /// </summary>
        [HttpDelete("{conversationId}/participants/{userId}")]
        public async Task<ActionResult> KickParticipant(int conversationId, int userId)
        {
            var currentUserId = GetCurrentUserId();

            // Konuşmanın varlığını kontrol et
            var conversation = await _unitOfWork.Conversations.GetConversationWithParticipantsAsync(conversationId);
            if (conversation == null)
            {
                return NotFound("Konuşma bulunamadı.");
            }

            if (conversation.Type != ConversationType.GroupChat)
            {
                return BadRequest("Sadece grup konuşmalarından katılımcı atabilirsiniz.");
            }

            // Current user'ın yetki kontrolü (sadece Owner)
            var currentParticipant = conversation.Participants
                .FirstOrDefault(p => p.UserId == currentUserId && p.IsActive);

            if (currentParticipant == null || currentParticipant.Role != ParticipantRole.Owner)
            {
                return Forbid("Katılımcı atma yetkiniz yok. Sadece grup sahibi katılımcı atabilir.");
            }

            // Atılacak katılımcıyı bul
            var participantToKick = conversation.Participants
                .FirstOrDefault(p => p.UserId == userId && p.IsActive);

            if (participantToKick == null)
            {
                return NotFound("Katılımcı bu konuşmada bulunamadı.");
            }

            if (participantToKick.UserId == currentUserId)
            {
                return BadRequest("Kendinizi atamazsınız. Gruptan ayrılmak için leave endpoint'ini kullanın.");
            }

            // Katılımcıyı inaktif yap
            participantToKick.IsActive = false;
            participantToKick.LeftAt = DateTime.UtcNow;
            participantToKick.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<ConversationParticipant>().UpdateAsync(participantToKick);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {userId} was kicked from conversation {conversationId} by owner {currentUserId}");

            return Ok(new { message = "Katılımcı gruptan atıldı." });
        }

        /// <summary>
        /// Konuşmadaki tüm mesajları temizle
        /// </summary>
        [HttpDelete("{conversationId}/messages")]
        public async Task<ActionResult> ClearMessages(int conversationId)
        {
            var currentUserId = GetCurrentUserId();

            // Kullanıcının bu konuşmaya erişimi var mı kontrol et
            if (!await _unitOfWork.Conversations.IsUserInConversationAsync(currentUserId, conversationId))
            {
                return Forbid("Bu konuşmaya erişim yetkiniz yok.");
            }

            try
            {
                // Konuşmadaki tüm mesajları sil (soft delete)
                await _unitOfWork.Messages.ClearConversationMessagesAsync(conversationId);
                await _unitOfWork.SaveAsync();

                _logger.LogInformation($"User {currentUserId} cleared all messages in conversation {conversationId}");

                return Ok(new { message = "Tüm mesajlar temizlendi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error clearing messages for conversation {conversationId} by user {currentUserId}");
                return StatusCode(500, new { message = "Mesajlar temizlenirken hata oluştu." });
            }
        }

        /// <summary>
        /// Konuşmaları ara
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult> SearchConversations([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Arama terimi gerekli.");
            }

            var currentUserId = GetCurrentUserId();
            var conversations = await _unitOfWork.Conversations.SearchConversationsAsync(currentUserId, query);

            var searchResults = conversations.Select(conversation => new
            {
                id = conversation.Id,
                type = conversation.Type.ToString().ToLower(),
                title = GetConversationTitle(conversation, currentUserId),
                participants = conversation.Participants.Where(p => p.IsActive).Select(p => new
                {
                    id = p.User.Id,
                    username = p.User.Username,
                    firstName = p.User.FirstName,
                    lastName = p.User.LastName,
                    avatarUrl = p.User.AvatarUrl
                }).ToList(),
                lastMessage = conversation.LastMessage != null ? new
                {
                    content = conversation.LastMessage.Content,
                    createdAt = conversation.LastMessage.CreatedAt
                } : null
            });

            return Ok(searchResults);
        }

        private string GetConversationTitle(Conversation conversation, int currentUserId)
        {
            if (conversation.Type == ConversationType.GroupChat)
            {
                return conversation.Title ?? "Grup Konuşması";
            }

            // Direkt mesaj için diğer katılımcının adını döndür
            var otherParticipant = conversation.Participants
                .FirstOrDefault(p => p.UserId != currentUserId && p.IsActive);

            if (otherParticipant != null)
            {
                var displayName = !string.IsNullOrEmpty(otherParticipant.User.FirstName) || !string.IsNullOrEmpty(otherParticipant.User.LastName)
                    ? $"{otherParticipant.User.FirstName} {otherParticipant.User.LastName}".Trim()
                    : otherParticipant.User.Username;

                return displayName;
            }

            return "Direkt Mesaj";
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

    public class CreateGroupConversationRequest
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? GroupImageUrl { get; set; }
        public List<int> ParticipantIds { get; set; } = new();
    }

    public class AddParticipantRequest
    {
        public int UserId { get; set; }
    }
}