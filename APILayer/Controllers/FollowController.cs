using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DomainLayer.Interfaces;
using DomainLayer.Entities;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FollowController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<FollowController> _logger;

        public FollowController(IUnitOfWork unitOfWork, ILogger<FollowController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        /// <summary>
        /// Kullanıcıyı takip et
        /// </summary>
        [HttpPost("follow/{userId}")]
        public async Task<ActionResult> FollowUser(int userId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == userId)
            {
                return BadRequest("Kendini takip edemezsin.");
            }

            // Takip edilecek kullanıcının varlığını kontrol et
            var targetUser = await _unitOfWork.Users.GetByIdAsync(userId);
            if (targetUser == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            // Zaten takip ediyor mu kontrol et
            var existingFollow = await _unitOfWork.Follows.GetByUsersAsync(currentUserId, userId);
            if (existingFollow != null)
            {
                if (existingFollow.IsActive)
                {
                    return BadRequest("Bu kullanıcıyı zaten takip ediyorsunuz.");
                }
                else
                {
                    // Eski takibi yeniden aktif et
                    existingFollow.IsActive = true;
                    existingFollow.FollowedAt = DateTime.UtcNow;
                    existingFollow.UnfollowedAt = null;
                    existingFollow.UpdatedAt = DateTime.UtcNow;

                    await _unitOfWork.Follows.UpdateAsync(existingFollow);
                }
            }
            else
            {
                // Yeni takip kaydı oluştur
                var follow = new Follow
                {
                    FollowerId = currentUserId,
                    FollowingId = userId,
                    FollowedAt = DateTime.UtcNow,
                    IsActive = true,
                    NotificationsEnabled = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Follows.AddAsync(follow);
            }

            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {currentUserId} followed user {userId}");

            return Ok(new { message = "Kullanıcı takip edildi." });
        }

        /// <summary>
        /// Kullanıcıyı takip etmeyi bırak
        /// </summary>
        [HttpDelete("unfollow/{userId}")]
        public async Task<ActionResult> UnfollowUser(int userId)
        {
            var currentUserId = GetCurrentUserId();

            var follow = await _unitOfWork.Follows.GetByUsersAsync(currentUserId, userId);
            if (follow == null || !follow.IsActive)
            {
                return NotFound("Bu kullanıcıyı takip etmiyorsunuz.");
            }

            follow.IsActive = false;
            follow.UnfollowedAt = DateTime.UtcNow;
            follow.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Follows.UpdateAsync(follow);
            await _unitOfWork.SaveAsync();

            _logger.LogInformation($"User {currentUserId} unfollowed user {userId}");

            return Ok(new { message = "Kullanıcıyı takip etmeyi bıraktınız." });
        }

        /// <summary>
        /// Takip ettiğim kullanıcılar
        /// </summary>
        [HttpGet("following")]
        public async Task<ActionResult> GetFollowing([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var currentUserId = GetCurrentUserId();

            var followingUsers = await _unitOfWork.Follows.GetFollowingUsersAsync(currentUserId);

            var followingList = followingUsers.Select(user => new
            {
                id = user.Id,
                username = user.Username,
                firstName = user.FirstName,
                lastName = user.LastName,
                avatarUrl = user.AvatarUrl,
                bio = user.Bio,
                isOnline = false // Bu bilgiyi SignalR'dan alacağız
            });

            return Ok(new
            {
                users = followingList.Skip((page - 1) * pageSize).Take(pageSize),
                totalCount = followingList.Count(),
                page = page,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling(followingList.Count() / (double)pageSize)
            });
        }

        /// <summary>
        /// Takipçilerim
        /// </summary>
        [HttpGet("followers")]
        public async Task<ActionResult> GetFollowers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var currentUserId = GetCurrentUserId();

            var followers = await _unitOfWork.Follows.GetFollowerUsersAsync(currentUserId);

            var followersList = followers.Select(user => new
            {
                id = user.Id,
                username = user.Username,
                firstName = user.FirstName,
                lastName = user.LastName,
                avatarUrl = user.AvatarUrl,
                bio = user.Bio,
                isOnline = false // Bu bilgiyi SignalR'dan alacağız
            });

            return Ok(new
            {
                users = followersList.Skip((page - 1) * pageSize).Take(pageSize),
                totalCount = followersList.Count(),
                page = page,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling(followersList.Count() / (double)pageSize)
            });
        }

        /// <summary>
        /// Kullanıcının takipçi/takip istatistikleri
        /// </summary>
        [HttpGet("stats/{userId?}")]
        public async Task<ActionResult> GetFollowStats(int? userId = null)
        {
            var targetUserId = userId ?? GetCurrentUserId();

            var followersCount = await _unitOfWork.Follows.GetFollowersCountAsync(targetUserId);
            var followingCount = await _unitOfWork.Follows.GetFollowingCountAsync(targetUserId);

            return Ok(new
            {
                userId = targetUserId,
                followersCount = followersCount,
                followingCount = followingCount
            });
        }

        /// <summary>
        /// Takip durumunu kontrol et
        /// </summary>
        [HttpGet("status/{userId}")]
        public async Task<ActionResult> GetFollowStatus(int userId)
        {
            var currentUserId = GetCurrentUserId();
            
            if (currentUserId == userId)
            {
                return Ok(new { status = "self" });
            }

            var isFollowing = await _unitOfWork.Follows.IsFollowingAsync(currentUserId, userId);
            var isFollowedBy = await _unitOfWork.Follows.IsFollowingAsync(userId, currentUserId);

            return Ok(new
            {
                isFollowing = isFollowing,
                isFollowedBy = isFollowedBy,
                isMutual = isFollowing && isFollowedBy
            });
        }

        /// <summary>
        /// Bildirim ayarlarını güncelle
        /// </summary>
        [HttpPut("notifications/{userId}")]
        public async Task<ActionResult> UpdateNotificationSettings(int userId, [FromBody] bool enabled)
        {
            var currentUserId = GetCurrentUserId();

            var follow = await _unitOfWork.Follows.GetByUsersAsync(currentUserId, userId);
            if (follow == null || !follow.IsActive)
            {
                return NotFound("Bu kullanıcıyı takip etmiyorsunuz.");
            }

            follow.NotificationsEnabled = enabled;
            follow.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Follows.UpdateAsync(follow);
            await _unitOfWork.SaveAsync();

            return Ok(new 
            { 
                message = enabled ? "Bildirimler açıldı." : "Bildirimler kapatıldı.",
                notificationsEnabled = enabled 
            });
        }

        /// <summary>
        /// Kullanıcı önerileri (henüz takip etmediğim kullanıcılar)
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<ActionResult> GetFollowSuggestions([FromQuery] int limit = 10)
        {
            var currentUserId = GetCurrentUserId();

            // Zaten takip ettiğim kullanıcıların ID'lerini al
            var followingIds = (await _unitOfWork.Follows.GetFollowingAsync(currentUserId))
                .Where(f => f.IsActive)
                .Select(f => f.FollowingId)
                .ToList();

            // Arkadaşlarımın ID'lerini al
            var friendIds = (await _unitOfWork.Friendships.GetFriendsAsync(currentUserId))
                .Select(f => f.Id)
                .ToList();

            // Tüm kullanıcıları al (kendim ve takip ettiklerim hariç)
            var allUsers = await _unitOfWork.Users.GetAllAsync();
            var suggestions = allUsers
                .Where(u => u.Id != currentUserId && 
                           !followingIds.Contains(u.Id) &&
                           u.IsActive)
                .OrderBy(u => friendIds.Contains(u.Id) ? 0 : 1) // Arkadaşları önceliklendir
                .ThenByDescending(u => u.CreatedDate) // Yeni kullanıcıları tercih et
                .Take(limit)
                .Select(user => new
                {
                    id = user.Id,
                    username = user.Username,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    avatarUrl = user.AvatarUrl,
                    bio = user.Bio,
                    isFriend = friendIds.Contains(user.Id),
                    mutualFollowersCount = 0 // Bu daha karmaşık bir sorgu gerektirir
                });

            return Ok(suggestions);
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