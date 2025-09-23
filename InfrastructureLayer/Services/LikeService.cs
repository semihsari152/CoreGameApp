using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class LikeService : ILikeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public LikeService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<LikeDto?> GetLikeByIdAsync(int id)
        {
            var like = await _context.Likes
                .Include(l => l.User)
                .FirstOrDefaultAsync(l => l.Id == id);

            return like == null ? null : _mapper.Map<LikeDto>(like);
        }

        public async Task<IEnumerable<LikeDto>> GetLikesByEntityAsync(LikableType type, int entityId)
        {
            var likes = await _context.Likes
                .Include(l => l.User)
                .Where(l => l.LikableType == type && l.TargetEntityId == entityId)
                .OrderByDescending(l => l.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<LikeDto>>(likes);
        }

        public async Task<IEnumerable<LikeDto>> GetLikesByUserAsync(int userId)
        {
            var likes = await _context.Likes
                .Include(l => l.User)
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<LikeDto>>(likes);
        }

        public async Task<LikeDto?> GetUserLikeAsync(int userId, LikableType type, int entityId)
        {
            var like = await _context.Likes
                .Include(l => l.User)
                .FirstOrDefaultAsync(l => l.UserId == userId && 
                                        l.LikableType == type && 
                                        l.TargetEntityId == entityId);

            return like == null ? null : _mapper.Map<LikeDto>(like);
        }

        public async Task<int> GetLikeCountAsync(LikableType type, int entityId, bool isLike)
        {
            return await _context.Likes
                .CountAsync(l => l.LikableType == type && 
                               l.TargetEntityId == entityId && 
                               l.IsLike == isLike);
        }

        public async Task<bool> HasUserLikedAsync(int userId, LikableType type, int entityId)
        {
            return await _context.Likes
                .AnyAsync(l => l.UserId == userId && 
                              l.LikableType == type && 
                              l.TargetEntityId == entityId && 
                              l.IsLike);
        }

        public async Task<LikeDto> CreateLikeAsync(CreateLikeDto createLikeDto)
        {
            var like = _mapper.Map<Like>(createLikeDto);
            like.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.Likes.AddAsync(like);
            await _unitOfWork.SaveChangesAsync();

            return await GetLikeByIdAsync(like.Id) ?? throw new InvalidOperationException("Beğeni oluşturulamadı.");
        }

        public async Task DeleteLikeAsync(int id)
        {
            var like = await _unitOfWork.Likes.GetByIdAsync(id);
            if (like == null)
                throw new InvalidOperationException("Beğeni bulunamadı.");

            _unitOfWork.Likes.Remove(like);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task ToggleLikeAsync(int userId, LikableType type, int entityId, bool isLike)
        {
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.UserId == userId && 
                                        l.LikableType == type && 
                                        l.TargetEntityId == entityId);

            bool shouldNotify = false;

            if (existingLike != null)
            {
                if (existingLike.IsLike == isLike)
                {
                    // Same action, remove the like
                    _context.Likes.Remove(existingLike);
                    shouldNotify = false; // Don't notify when removing a like
                }
                else
                {
                    // Different action, update the like
                    existingLike.IsLike = isLike;
                    _context.Likes.Update(existingLike);
                    shouldNotify = isLike; // Only notify for likes, not dislikes
                }
            }
            else
            {
                // Create new like
                var like = new Like
                {
                    UserId = userId,
                    LikableType = type,
                    TargetEntityId = entityId,
                    IsLike = isLike,
                    CreatedDate = DateTime.UtcNow
                };

                await _context.Likes.AddAsync(like);
                shouldNotify = isLike; // Only notify for likes, not dislikes
            }

            await _context.SaveChangesAsync();

            // Send notification for new likes (but not dislikes)
            if (shouldNotify)
            {
                try
                {
                    await SendLikeNotificationAsync(userId, type, entityId);
                }
                catch (Exception ex)
                {
                    // Log notification error but don't fail the like operation
                    Console.WriteLine($"Failed to send like notification: {ex.Message}");
                }
            }
        }

        public async Task<LikeStatsDto> GetLikeStatsAsync(LikableType type, int entityId)
        {
            var likes = await _context.Likes
                .Where(l => l.LikableType == type && l.TargetEntityId == entityId)
                .ToListAsync();

            var likeCount = likes.Count(l => l.IsLike);
            var dislikeCount = likes.Count(l => !l.IsLike);

            return new LikeStatsDto
            {
                LikeCount = likeCount,
                DislikeCount = dislikeCount,
                TotalCount = likes.Count,
                LikePercentage = likes.Count > 0 ? (double)likeCount / likes.Count * 100 : 0
            };
        }

        private async Task SendLikeNotificationAsync(int triggerUserId, LikableType likableType, int entityId)
        {
            // Get entity details and target user based on likable type
            var (entityTitle, targetUserId) = await GetEntityDetailsAsync(likableType, entityId);
            
            if (string.IsNullOrEmpty(entityTitle) || !targetUserId.HasValue) return;

            // Don't notify self
            if (targetUserId.Value == triggerUserId) return;

            var notificationType = GetLikeNotificationType(likableType);
            
            await _notificationService.NotifyLikeAsync(
                targetUserId.Value,
                triggerUserId,
                notificationType,
                entityId,
                entityTitle
            );
        }

        private async Task<(string title, int? ownerId)> GetEntityDetailsAsync(LikableType likableType, int entityId)
        {
            return likableType switch
            {
                LikableType.ForumTopic => await GetForumTopicDetailsAsync(entityId),
                LikableType.BlogPost => await GetBlogPostDetailsAsync(entityId),
                LikableType.Guide => await GetGuideDetailsAsync(entityId),
                LikableType.Comment => await GetCommentDetailsAsync(entityId),
                LikableType.User => await GetUserDetailsAsync(entityId),
                _ => ("", null)
            };
        }

        private async Task<(string title, int? ownerId)> GetForumTopicDetailsAsync(int id)
        {
            var topic = await _context.ForumTopics.FindAsync(id);
            return topic != null ? (topic.Title, topic.UserId) : ("", null);
        }

        private async Task<(string title, int? ownerId)> GetBlogPostDetailsAsync(int id)
        {
            var blog = await _context.BlogPosts.FindAsync(id);
            return blog != null ? (blog.Title, blog.UserId) : ("", null);
        }

        private async Task<(string title, int? ownerId)> GetGuideDetailsAsync(int id)
        {
            var guide = await _context.Guides.FindAsync(id);
            return guide != null ? (guide.Title, guide.UserId) : ("", null);
        }

        private async Task<(string title, int? ownerId)> GetCommentDetailsAsync(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return ("", null);
            
            // For comments, we truncate the content as the "title"
            var title = comment.Content.Length > 50 ? comment.Content.Substring(0, 47) + "..." : comment.Content;
            return (title, comment.UserId);
        }

        private async Task<(string title, int? ownerId)> GetUserDetailsAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? (user.Username, user.Id) : ("", null);
        }

        private NotificationType GetLikeNotificationType(LikableType likableType)
        {
            return likableType switch
            {
                LikableType.ForumTopic => NotificationType.LikeOnForumTopic,
                LikableType.BlogPost => NotificationType.LikeOnBlogPost,
                LikableType.Guide => NotificationType.LikeOnGuide,
                LikableType.Comment => NotificationType.LikeOnComment,
                LikableType.User => NotificationType.LikeOnUser,
                _ => NotificationType.LikeOnComment // Default fallback
            };
        }
    }
}