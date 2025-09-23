using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DomainLayer.Interfaces;
using DomainLayer.Entities;
using DomainLayer.Enums;
using ApplicationLayer.Services;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendshipController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<FriendshipController> _logger;
        private readonly INotificationService _notificationService;

        public FriendshipController(IUnitOfWork unitOfWork, ILogger<FriendshipController> logger, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Arkadaşlık isteği gönder
        /// </summary>
        [HttpPost("send-request/{receiverId}")]
        public async Task<ActionResult> SendFriendRequest(int receiverId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == receiverId)
            {
                return BadRequest("Kendine arkadaşlık isteği gönderemezsin.");
            }

            // Alıcı kullanıcının varlığını kontrol et
            var receiver = await _unitOfWork.Users.GetByIdAsync(receiverId);
            if (receiver == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            // Mevcut arkadaşlık durumunu kontrol et
            var existingFriendship = await _unitOfWork.Friendships.GetByUsersAsync(currentUserId, receiverId);
            _logger.LogInformation($"Existing friendship found: {existingFriendship != null}, Status: {existingFriendship?.Status}, SenderId: {existingFriendship?.SenderId}, ReceiverId: {existingFriendship?.ReceiverId}");
            
            if (existingFriendship != null)
            {
                switch (existingFriendship.Status)
                {
                    case FriendshipStatus.Accepted:
                        return BadRequest("Zaten arkadaşsınız.");
                    case FriendshipStatus.Pending:
                        return BadRequest("Zaten bekleyen bir arkadaşlık isteğiniz var.");
                    case FriendshipStatus.Blocked:
                        return BadRequest("Bu kullanıcıyla arkadaş olamazsınız.");
                    case FriendshipStatus.Cancelled:
                    case FriendshipStatus.Declined:
                        // Cancelled veya Declined durumlarda yeniden istek gönderebilir
                        // Mevcut kaydı güncelle
                        existingFriendship.Status = FriendshipStatus.Pending;
                        existingFriendship.SenderId = currentUserId;
                        existingFriendship.ReceiverId = receiverId;
                        existingFriendship.RequestedAt = DateTime.UtcNow;
                        existingFriendship.UpdatedAt = DateTime.UtcNow;
                        existingFriendship.RespondedAt = null;
                        
                        await _unitOfWork.SaveAsync();
                        
                        // Bildirim gönder
                        var requestSender = await _unitOfWork.Users.GetByIdAsync(currentUserId);
                        await _notificationService.CreateSystemNotificationAsync(
                            receiverId,
                            "Yeni Arkadaşlık İsteği",
                            $"{requestSender?.FirstName} {requestSender?.LastName} ({requestSender?.Username}) size arkadaşlık isteği gönderdi."
                        );
                        
                        _logger.LogInformation($"Friend request resent from user {currentUserId} to user {receiverId}");
                        return Ok(new { message = "Arkadaşlık isteği gönderildi." });
                }
            }

            // Yeni arkadaşlık isteği oluştur
            var friendship = new Friendship
            {
                SenderId = currentUserId,
                ReceiverId = receiverId,
                Status = FriendshipStatus.Pending,
                RequestedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Friendships.AddAsync(friendship);
            await _unitOfWork.SaveAsync();

            // Bildirim gönder
            var sender = await _unitOfWork.Users.GetByIdAsync(currentUserId);
            await _notificationService.CreateSystemNotificationAsync(
                receiverId,
                "Yeni Arkadaşlık İsteği",
                $"{sender?.FirstName} {sender?.LastName} ({sender?.Username}) size arkadaşlık isteği gönderdi."
            );

            _logger.LogInformation($"Friend request sent from user {currentUserId} to user {receiverId}");

            return Ok(new { message = "Arkadaşlık isteği gönderildi." });
        }

        /// <summary>
        /// Arkadaşlık isteğini kabul et
        /// </summary>
        [HttpPost("accept/{requestId}")]
        public async Task<ActionResult> AcceptFriendRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            var friendship = await _unitOfWork.Friendships.GetByIdAsync(requestId);
            if (friendship == null)
            {
                return NotFound("Arkadaşlık isteği bulunamadı.");
            }

            if (friendship.ReceiverId != currentUserId)
            {
                return Forbid("Bu arkadaşlık isteğini kabul etme yetkiniz yok.");
            }

            if (friendship.Status != FriendshipStatus.Pending)
            {
                return BadRequest("Bu arkadaşlık isteği zaten işlenmiş.");
            }

            friendship.Status = FriendshipStatus.Accepted;
            friendship.RespondedAt = DateTime.UtcNow;
            friendship.FriendsSince = DateTime.UtcNow;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Friendships.UpdateAsync(friendship);
            await _unitOfWork.SaveAsync();

            // Arkadaşlık kabul edildiğine dair bildirim gönder
            var accepter = await _unitOfWork.Users.GetByIdAsync(currentUserId);
            await _notificationService.CreateSystemNotificationAsync(
                friendship.SenderId,
                "Arkadaşlık İsteği Kabul Edildi",
                $"{accepter?.FirstName} {accepter?.LastName} ({accepter?.Username}) arkadaşlık isteğinizi kabul etti."
            );

            _logger.LogInformation($"Friend request {requestId} accepted by user {currentUserId}");

            return Ok(new { message = "Arkadaşlık isteği kabul edildi." });
        }

        /// <summary>
        /// Gönderdiğin arkadaşlık isteğini iptal et (sender için)
        /// </summary>
        [HttpDelete("cancel/{requestId}")]
        public async Task<ActionResult> CancelFriendRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            var friendship = await _unitOfWork.Friendships.GetByIdAsync(requestId);
            if (friendship == null)
            {
                return NotFound("Arkadaşlık isteği bulunamadı.");
            }

            // Sadece gönderen iptal edebilir
            if (friendship.SenderId != currentUserId)
            {
                return Forbid("Bu arkadaşlık isteğini iptal etme yetkiniz yok.");
            }

            if (friendship.Status != FriendshipStatus.Pending)
            {
                return BadRequest("Bu arkadaşlık isteği zaten işlenmiş.");
            }

            friendship.Status = FriendshipStatus.Cancelled;
            friendship.RespondedAt = DateTime.UtcNow;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Friendships.UpdateAsync(friendship);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"Friend request {requestId} cancelled by user {currentUserId}");

            return Ok(new { message = "Arkadaşlık isteği iptal edildi." });
        }

        /// <summary>
        /// Arkadaşlık isteğini reddet
        /// </summary>
        [HttpPost("decline/{requestId}")]
        public async Task<ActionResult> DeclineFriendRequest(int requestId)
        {
            var currentUserId = GetCurrentUserId();

            var friendship = await _unitOfWork.Friendships.GetByIdAsync(requestId);
            if (friendship == null)
            {
                return NotFound("Arkadaşlık isteği bulunamadı.");
            }

            if (friendship.ReceiverId != currentUserId)
            {
                return Forbid("Bu arkadaşlık isteğini reddetme yetkiniz yok.");
            }

            if (friendship.Status != FriendshipStatus.Pending)
            {
                return BadRequest("Bu arkadaşlık isteği zaten işlenmiş.");
            }

            friendship.Status = FriendshipStatus.Declined;
            friendship.RespondedAt = DateTime.UtcNow;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Friendships.UpdateAsync(friendship);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"Friend request {requestId} declined by user {currentUserId}");

            return Ok(new { message = "Arkadaşlık isteği reddedildi." });
        }

        /// <summary>
        /// Arkadaşlığı sonlandır
        /// </summary>
        [HttpDelete("remove/{friendId}")]
        public async Task<ActionResult> RemoveFriend(int friendId)
        {
            var currentUserId = GetCurrentUserId();

            var friendship = await _unitOfWork.Friendships.GetByUsersAsync(currentUserId, friendId);
            if (friendship == null)
            {
                return NotFound("Arkadaşlık bulunamadı.");
            }

            if (friendship.Status != FriendshipStatus.Accepted)
            {
                return BadRequest("Bu kişi ile arkadaş değilsiniz.");
            }

            friendship.Status = FriendshipStatus.Cancelled;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Friendships.UpdateAsync(friendship);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"Friendship removed between users {currentUserId} and {friendId}");

            return Ok(new { message = "Arkadaşlık sonlandırıldı." });
        }

        /// <summary>
        /// Kullanıcıyı blokla
        /// </summary>
        [HttpPost("block/{userId}")]
        public async Task<ActionResult> BlockUser(int userId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == userId)
            {
                return BadRequest("Kendini bloklayamazsın.");
            }

            var existingFriendship = await _unitOfWork.Friendships.GetByUsersAsync(currentUserId, userId);
            
            if (existingFriendship == null)
            {
                // Yeni blokla kaydı oluştur
                var friendship = new Friendship
                {
                    SenderId = currentUserId,
                    ReceiverId = userId,
                    Status = FriendshipStatus.Blocked,
                    IsBlocked = true,
                    BlockedById = currentUserId,
                    BlockedAt = DateTime.UtcNow,
                    RequestedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Friendships.AddAsync(friendship);
            }
            else
            {
                // Mevcut kaydı güncelle
                existingFriendship.Status = FriendshipStatus.Blocked;
                existingFriendship.IsBlocked = true;
                existingFriendship.BlockedById = currentUserId;
                existingFriendship.BlockedAt = DateTime.UtcNow;
                existingFriendship.UpdatedAt = DateTime.UtcNow;

                await _unitOfWork.Friendships.UpdateAsync(existingFriendship);
            }

            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {userId} blocked by user {currentUserId}");

            return Ok(new { message = "Kullanıcı bloklandı." });
        }

        /// <summary>
        /// Kullanıcının blokunu kaldır
        /// </summary>
        [HttpPost("unblock/{userId}")]
        public async Task<ActionResult> UnblockUser(int userId)
        {
            var currentUserId = GetCurrentUserId();

            var friendship = await _unitOfWork.Friendships.GetByUsersAsync(currentUserId, userId);
            if (friendship == null || friendship.Status != FriendshipStatus.Blocked)
            {
                return NotFound("Bloklanmış kullanıcı bulunamadı.");
            }

            if (friendship.BlockedById != currentUserId)
            {
                return Forbid("Bu kullanıcının blokunu kaldırma yetkiniz yok.");
            }

            friendship.Status = FriendshipStatus.Cancelled;
            friendship.IsBlocked = false;
            friendship.BlockedById = null;
            friendship.BlockedAt = null;
            friendship.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Friendships.UpdateAsync(friendship);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {userId} unblocked by user {currentUserId}");

            return Ok(new { message = "Kullanıcının bloku kaldırıldı." });
        }

        /// <summary>
        /// Engellenenler listesi
        /// </summary>
        [HttpGet("blocked")]
        public async Task<ActionResult> GetBlockedUsers()
        {
            var currentUserId = GetCurrentUserId();

            // Kullanıcının bloklamış olduğu kişileri getir
            var blockedFriendships = await _unitOfWork.Friendships.GetBlockedUsersAsync(currentUserId);

            var blockedUsersList = blockedFriendships.Select(friendship => 
            {
                // Bloklayanın kendisi olduğu durumda karşı tarafı al
                var blockedUser = friendship.SenderId == currentUserId ? friendship.Receiver : friendship.Sender;
                
                return new
                {
                    id = blockedUser.Id,
                    username = blockedUser.Username,
                    firstName = blockedUser.FirstName,
                    lastName = blockedUser.LastName,
                    avatarUrl = blockedUser.AvatarUrl,
                    isOnline = false,
                    blockedAt = friendship.BlockedAt
                };
            });

            return Ok(blockedUsersList);
        }

        /// <summary>
        /// Arkadaş listesi
        /// </summary>
        [HttpGet("friends")]
        public async Task<ActionResult> GetFriends()
        {
            var currentUserId = GetCurrentUserId();

            var friends = await _unitOfWork.Friendships.GetFriendsAsync(currentUserId);

            var friendsList = friends.Select(friend => new
            {
                id = friend.Id,
                username = friend.Username,
                firstName = friend.FirstName,
                lastName = friend.LastName,
                avatarUrl = friend.AvatarUrl,
                isOnline = false, // Bu bilgiyi SignalR'dan alacağız
                lastLoginAt = friend.LastLoginDate
            });

            return Ok(friendsList);
        }

        /// <summary>
        /// Gelen arkadaşlık istekleri
        /// </summary>
        [HttpGet("requests/incoming")]
        public async Task<ActionResult> GetIncomingFriendRequests()
        {
            var currentUserId = GetCurrentUserId();

            var requests = await _unitOfWork.Friendships.GetFriendRequestsAsync(currentUserId);

            var requestsList = requests.Select(request => new
            {
                id = request.Id,
                sender = new
                {
                    id = request.Sender.Id,
                    username = request.Sender.Username,
                    firstName = request.Sender.FirstName,
                    lastName = request.Sender.LastName,
                    avatarUrl = request.Sender.AvatarUrl
                },
                requestedAt = request.RequestedAt
            });

            return Ok(requestsList);
        }

        /// <summary>
        /// Gönderilen arkadaşlık istekleri
        /// </summary>
        [HttpGet("requests/sent")]
        public async Task<ActionResult> GetSentFriendRequests()
        {
            var currentUserId = GetCurrentUserId();

            var requests = await _unitOfWork.Friendships.GetSentFriendRequestsAsync(currentUserId);

            var requestsList = requests.Select(request => new
            {
                id = request.Id,
                receiver = new
                {
                    id = request.Receiver.Id,
                    username = request.Receiver.Username,
                    firstName = request.Receiver.FirstName,
                    lastName = request.Receiver.LastName,
                    avatarUrl = request.Receiver.AvatarUrl
                },
                requestedAt = request.RequestedAt
            });

            return Ok(requestsList);
        }

        /// <summary>
        /// İki kullanıcı arasındaki arkadaşlık durumunu kontrol et
        /// </summary>
        [HttpGet("status/{userId}")]
        public async Task<ActionResult> GetFriendshipStatus(int userId)
        {
            var currentUserId = GetCurrentUserId();
            
            if (currentUserId == userId)
            {
                return Ok(new { status = "self" });
            }

            var friendship = await _unitOfWork.Friendships.GetByUsersAsync(currentUserId, userId);

            if (friendship == null)
            {
                return Ok(new { status = "none" });
            }

            var status = friendship.Status.ToString().ToLower();
            var isPending = friendship.Status == FriendshipStatus.Pending;
            var isSender = friendship.SenderId == currentUserId;

            return Ok(new
            {
                id = friendship.Id,
                status = status,
                isPending = isPending,
                isSender = isSender,
                canAccept = isPending && !isSender,
                canDecline = isPending && !isSender,
                canCancel = isPending && isSender,
                isBlocked = friendship.IsBlocked,
                blockedBy = friendship.BlockedById
            });
        }

        /// <summary>
        /// Arkadaş önerileri - Ortak arkadaşlar ve ilgi alanlarına göre
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<ActionResult<IEnumerable<object>>> GetFriendSuggestions(int limit = 10)
        {
            var currentUserId = GetCurrentUserId();
            
            // Mevcut arkadaşları ve bekleyen istekleri al
            var existingConnections = await _unitOfWork.Friendships.GetUserConnectionsAsync(currentUserId);
            var excludeUserIds = existingConnections.Select(f => 
                f.SenderId == currentUserId ? f.ReceiverId : f.SenderId
            ).ToList();
            excludeUserIds.Add(currentUserId); // Kendisini de hariç tut

            // Öneri algoritması
            var suggestions = await _unitOfWork.Users.GetSuggestedFriendsAsync(currentUserId, excludeUserIds, limit);
            
            return Ok(suggestions.Select(user => new {
                id = user.Id,
                username = user.Username,
                firstName = user.FirstName,
                lastName = user.LastName,
                avatarUrl = user.AvatarUrl,
                level = user.Level,
                xp = user.XP,
                mutualFriends = 0, // TODO: Ortak arkadaş sayısını hesapla
                isOnline = user.IsActive && user.Status == 0
            }));
        }

        /// <summary>
        /// Kullanıcı arama - Username, ad, soyad ile arama
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchUsers(string query, int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return BadRequest("Arama terimi en az 2 karakter olmalı.");
            }

            var currentUserId = GetCurrentUserId();
            var users = await _unitOfWork.Users.SearchUsersAsync(query, currentUserId, limit);

            return Ok(users.Select(user => new {
                id = user.Id,
                username = user.Username,
                firstName = user.FirstName,
                lastName = user.LastName,
                avatarUrl = user.AvatarUrl,
                level = user.Level,
                xp = user.XP,
                isOnline = user.IsActive && user.Status == 0
            }));
        }

        /// <summary>
        /// Popüler kullanıcılar - En yüksek seviye ve aktif kullanıcılar
        /// </summary>
        [HttpGet("popular")]
        public async Task<ActionResult<IEnumerable<object>>> GetPopularUsers(int limit = 15)
        {
            var currentUserId = GetCurrentUserId();
            
            // Mevcut arkadaşları hariç tut
            var existingConnections = await _unitOfWork.Friendships.GetUserConnectionsAsync(currentUserId);
            var excludeUserIds = existingConnections.Select(f => 
                f.SenderId == currentUserId ? f.ReceiverId : f.SenderId
            ).ToList();
            excludeUserIds.Add(currentUserId);

            var users = await _unitOfWork.Users.GetPopularUsersAsync(excludeUserIds, limit);

            return Ok(users.Select(user => new {
                id = user.Id,
                username = user.Username,
                firstName = user.FirstName,
                lastName = user.LastName,
                avatarUrl = user.AvatarUrl,
                level = user.Level,
                xp = user.XP,
                friendCount = 0, // TODO: Arkadaş sayısını hesapla
                isOnline = user.IsActive && user.Status == 0
            }));
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
                return userId;
            }

            // Try to get user ID from email or any other identifier
            var emailClaim = User.FindFirst(ClaimTypes.Email);
            if (emailClaim != null)
            {
                // Try to find user by email
                var user = _unitOfWork.Users.GetByEmailAsync(emailClaim.Value).Result;
                if (user != null)
                {
                    return user.Id;
                }
            }
            
            throw new UnauthorizedAccessException("User ID not found in token");
        }
    }
}