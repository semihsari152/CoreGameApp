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
    public class CommentService : ICommentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public CommentService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<CommentDto?> GetCommentByIdAsync(int id)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.ChildComments.Where(cc => !cc.IsDeleted))
                    .ThenInclude(cc => cc.User)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            return comment == null ? null : _mapper.Map<CommentDto>(comment);
        }

        public async Task<IEnumerable<CommentDto>> GetCommentsByEntityAsync(CommentableType commentableType, int entityId)
        {
            return await GetCommentsByEntityAsync(commentableType, entityId, null);
        }

        public async Task<IEnumerable<CommentDto>> GetCommentsByEntityAsync(CommentableType commentableType, int entityId, int? currentUserId)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.ChildComments.Where(cc => !cc.IsDeleted))
                    .ThenInclude(cc => cc.User)
                .Where(c => c.CommentableType == commentableType && 
                           c.TargetEntityId == entityId && 
                           !c.IsDeleted)
                .OrderBy(c => c.CreatedDate)
                .ToListAsync();

            var commentDtos = _mapper.Map<IEnumerable<CommentDto>>(comments).ToList();

            // If current user is provided, populate like/dislike status
            if (currentUserId.HasValue)
            {
                await PopulateUserInteractionFlags(commentDtos, currentUserId.Value);
            }
            
            // Populate owner like information
            await PopulateOwnerLikeFlags(commentDtos, commentableType, entityId);

            return commentDtos;
        }

        public async Task<IEnumerable<CommentDto>> GetCommentsByUserAsync(int userId)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.UserId == userId && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CommentDto>>(comments);
        }

        public async Task<CommentDto> CreateCommentAsync(int userId, CreateCommentDto createCommentDto)
        {
            // Validate entity exists based on commentable type
            await ValidateCommentableEntityAsync(createCommentDto.CommentableType, createCommentDto.CommentableEntityId);

            // Validate parent comment if specified
            if (createCommentDto.ParentCommentId.HasValue)
            {
                var parentComment = await _unitOfWork.Comments.GetByIdAsync(createCommentDto.ParentCommentId.Value);
                if (parentComment == null || parentComment.IsDeleted)
                    throw new InvalidOperationException("Üst yorum bulunamadı.");

                // Ensure parent comment is for the same entity
                if (parentComment.CommentableType != createCommentDto.CommentableType ||
                    parentComment.TargetEntityId != createCommentDto.CommentableEntityId)
                    throw new InvalidOperationException("Üst yorum farklı bir varlığa ait.");
            }

            var comment = _mapper.Map<Comment>(createCommentDto);
            comment.UserId = userId;
            comment.CreatedDate = DateTime.UtcNow;
            comment.UpdatedDate = DateTime.UtcNow;

            await _unitOfWork.Comments.AddAsync(comment);
            await _unitOfWork.SaveChangesAsync();

            // Send notifications
            try
            {
                await SendCommentNotificationsAsync(comment);
            }
            catch (Exception ex)
            {
                // Log notification error but don't fail the comment creation
                Console.WriteLine($"Failed to send comment notifications: {ex.Message}");
            }

            return await GetCommentByIdAsync(comment.Id) ?? throw new InvalidOperationException("Yorum oluşturulamadı.");
        }

        public async Task<CommentDto> UpdateCommentAsync(int id, int userId, UpdateCommentDto updateCommentDto)
        {
            var comment = await _unitOfWork.Comments.GetByIdAsync(id);
            if (comment == null || comment.IsDeleted)
                throw new InvalidOperationException("Yorum bulunamadı.");

            if (comment.UserId != userId)
                throw new UnauthorizedAccessException("Bu yorumu düzenleme yetkiniz yok.");

            _mapper.Map(updateCommentDto, comment);
            comment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Comments.Update(comment);
            await _unitOfWork.SaveChangesAsync();

            return await GetCommentByIdAsync(id) ?? throw new InvalidOperationException("Yorum güncellenemedi.");
        }

        public async Task<bool> DeleteCommentAsync(int id, int userId)
        {
            var comment = await _unitOfWork.Comments.GetByIdAsync(id);
            if (comment == null || comment.IsDeleted)
                return false;

            if (comment.UserId != userId)
                throw new UnauthorizedAccessException("Bu yorumu silme yetkiniz yok.");

            comment.IsDeleted = true;
            comment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Comments.Update(comment);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> LikeCommentAsync(int commentId, int userId)
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == commentId && !c.IsDeleted);
            if (comment == null)
                return false;

            // Check if this user is the owner of the post this comment belongs to
            bool isOwnerLike = await IsUserPostOwnerAsync(comment, userId);

            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.LikableType == LikableType.Comment && 
                                         l.TargetEntityId == commentId && 
                                         l.UserId == userId);

            if (existingLike != null)
            {
                if (existingLike.IsLike)
                {
                    // Already liked - remove the like (toggle behavior)
                    _context.Likes.Remove(existingLike);
                    await _context.SaveChangesAsync();
                    await UpdateCommentLikeCountsAsync(commentId);
                    return false; // Indicates like was removed
                }

                existingLike.IsLike = true;
                existingLike.IsOwnerLike = isOwnerLike;
                _context.Likes.Update(existingLike);
            }
            else
            {
                var like = new Like
                {
                    LikableType = LikableType.Comment,
                    TargetEntityId = commentId,
                    UserId = userId,
                    IsLike = true,
                    IsOwnerLike = isOwnerLike,
                    CreatedDate = DateTime.UtcNow
                };

                await _context.Likes.AddAsync(like);
            }

            await _context.SaveChangesAsync();
            await UpdateCommentLikeCountsAsync(commentId);

            return true;
        }

        public async Task<bool> UnlikeCommentAsync(int commentId, int userId)
        {
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.LikableType == LikableType.Comment && 
                                         l.TargetEntityId == commentId && 
                                         l.UserId == userId && 
                                         l.IsLike);

            if (existingLike == null)
                return false;

            _context.Likes.Remove(existingLike);
            await _context.SaveChangesAsync();
            await UpdateCommentLikeCountsAsync(commentId);

            return true;
        }

        public async Task<bool> DislikeCommentAsync(int commentId, int userId)
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == commentId && !c.IsDeleted);
            if (comment == null)
                return false;

            // Check if this user is the owner of the post this comment belongs to
            bool isOwnerLike = await IsUserPostOwnerAsync(comment, userId);

            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.LikableType == LikableType.Comment && 
                                         l.TargetEntityId == commentId && 
                                         l.UserId == userId);

            if (existingLike != null)
            {
                if (!existingLike.IsLike)
                {
                    // Already disliked - remove the dislike (toggle behavior)
                    _context.Likes.Remove(existingLike);
                    await _context.SaveChangesAsync();
                    await UpdateCommentLikeCountsAsync(commentId);
                    return false; // Indicates dislike was removed
                }

                existingLike.IsLike = false;
                existingLike.IsOwnerLike = isOwnerLike;
                _context.Likes.Update(existingLike);
            }
            else
            {
                var dislike = new Like
                {
                    LikableType = LikableType.Comment,
                    TargetEntityId = commentId,
                    UserId = userId,
                    IsLike = false,
                    IsOwnerLike = isOwnerLike,
                    CreatedDate = DateTime.UtcNow
                };

                await _context.Likes.AddAsync(dislike);
            }

            await _context.SaveChangesAsync();
            await UpdateCommentLikeCountsAsync(commentId);

            return true;
        }

        public async Task<bool> UndislikeCommentAsync(int commentId, int userId)
        {
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.LikableType == LikableType.Comment && 
                                         l.TargetEntityId == commentId && 
                                         l.UserId == userId && 
                                         !l.IsLike);

            if (existingLike == null)
                return false;

            _context.Likes.Remove(existingLike);
            await _context.SaveChangesAsync();
            await UpdateCommentLikeCountsAsync(commentId);

            return true;
        }

        public async Task<int> GetCommentsCountAsync(CommentableType commentableType, int entityId)
        {
            return await _context.Comments
                .CountAsync(c => c.CommentableType == commentableType && 
                               c.TargetEntityId == entityId && 
                               !c.IsDeleted);
        }

        public async Task<bool> ToggleStickyAsync(int commentId, int userId)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == commentId && !c.IsDeleted);

            if (comment == null)
                throw new InvalidOperationException("Yorum bulunamadı.");

            // Check if user is authorized to sticky comments
            // Only the post author can sticky comments
            var isAuthorized = await IsUserAuthorizedForCommentModeration(comment, userId);
            if (!isAuthorized)
                throw new UnauthorizedAccessException("Bu işlem için yetkiniz bulunmamaktadır.");

            // If making sticky, check if we already have 3 sticky comments
            if (!comment.IsSticky)
            {
                var stickyCount = await _context.Comments
                    .CountAsync(c => c.CommentableType == comment.CommentableType && 
                                c.TargetEntityId == comment.TargetEntityId && 
                                c.IsSticky && 
                                !c.IsDeleted);

                if (stickyCount >= 3)
                    throw new InvalidOperationException("Her post için maksimum 3 yorum sabitlenebilir.");
            }

            comment.IsSticky = !comment.IsSticky;
            comment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Comments.Update(comment);
            await _unitOfWork.SaveChangesAsync();

            // Send notification if comment is pinned
            if (comment.IsSticky)
            {
                try
                {
                    await _notificationService.NotifyCommentPinnedAsync(
                        comment.UserId,
                        userId,
                        comment.Id,
                        comment.Content
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send pin comment notification: {ex.Message}");
                }
            }

            return comment.IsSticky;
        }

        public async Task<bool> ToggleBestAnswerAsync(int commentId, int userId)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == commentId && !c.IsDeleted);

            if (comment == null)
                throw new InvalidOperationException("Yorum bulunamadı.");

            // Best answer is only available for forum posts
            if (comment.CommentableType != CommentableType.ForumTopic)
                throw new InvalidOperationException("En iyi cevap sadece forum konularında kullanılabilir.");

            // Check if user is authorized to mark best answers
            var isAuthorized = await IsUserAuthorizedForCommentModeration(comment, userId);
            if (!isAuthorized)
                throw new UnauthorizedAccessException("Bu işlem için yetkiniz bulunmamaktadır.");

            // If marking as best answer, remove best answer from other comments in the same thread
            if (!comment.IsBestAnswer)
            {
                var otherBestAnswers = await _context.Comments
                    .Where(c => c.CommentableType == comment.CommentableType && 
                               c.TargetEntityId == comment.TargetEntityId && 
                               c.IsBestAnswer && 
                               !c.IsDeleted)
                    .ToListAsync();

                foreach (var otherComment in otherBestAnswers)
                {
                    otherComment.IsBestAnswer = false;
                    otherComment.UpdatedDate = DateTime.UtcNow;
                }
            }

            comment.IsBestAnswer = !comment.IsBestAnswer;
            comment.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Comments.Update(comment);
            await _unitOfWork.SaveChangesAsync();

            // Send notification if marked as best answer
            if (comment.IsBestAnswer)
            {
                try
                {
                    var (entityTitle, _) = await GetEntityDetailsAsync(comment.CommentableType, comment.TargetEntityId);
                    await _notificationService.NotifyBestAnswerAsync(
                        comment.UserId,
                        userId,
                        comment.TargetEntityId,
                        entityTitle
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send best answer notification: {ex.Message}");
                }
            }

            return comment.IsBestAnswer;
        }

        private async Task UpdateCommentLikeCountsAsync(int commentId)
        {
            var comment = await _unitOfWork.Comments.GetByIdAsync(commentId);
            if (comment == null) return;

            var likes = await _context.Likes
                .Where(l => l.LikableType == LikableType.Comment && l.TargetEntityId == commentId)
                .ToListAsync();

            comment.LikesCount = likes.Count(l => l.IsLike);
            comment.DislikesCount = likes.Count(l => !l.IsLike);

            _unitOfWork.Comments.Update(comment);
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task PopulateUserInteractionFlags(List<CommentDto> comments, int userId)
        {
            if (!comments.Any()) return;

            var commentIds = GetAllCommentIds(comments);
            
            var userLikes = await _context.Likes
                .Where(l => l.LikableType == LikableType.Comment && 
                           commentIds.Contains(l.TargetEntityId) && 
                           l.UserId == userId)
                .ToListAsync();

            foreach (var comment in comments)
            {
                PopulateCommentInteractionFlags(comment, userLikes);
            }
        }

        private void PopulateCommentInteractionFlags(CommentDto comment, List<Like> userLikes)
        {
            var like = userLikes.FirstOrDefault(l => l.TargetEntityId == comment.Id);
            if (like != null)
            {
                comment.IsLikedByCurrentUser = like.IsLike;
                comment.IsDislikedByCurrentUser = !like.IsLike;
            }

            // Recursively populate child comments
            foreach (var childComment in comment.ChildComments)
            {
                PopulateCommentInteractionFlags(childComment, userLikes);
            }
        }

        private List<int> GetAllCommentIds(List<CommentDto> comments)
        {
            var ids = new List<int>();
            foreach (var comment in comments)
            {
                ids.Add(comment.Id);
                ids.AddRange(GetAllCommentIds(comment.ChildComments));
            }
            return ids;
        }

        private async Task<bool> IsUserAuthorizedForCommentModeration(DomainLayer.Entities.Comment comment, int userId)
        {
            // Check if user is the post/entity author based on commentable type
            switch (comment.CommentableType)
            {
                case CommentableType.ForumTopic:
                    var forumTopic = await _context.ForumTopics.FindAsync(comment.TargetEntityId);
                    return forumTopic?.UserId == userId;

                case CommentableType.BlogPost:
                    var blogPost = await _context.BlogPosts.FindAsync(comment.TargetEntityId);
                    return blogPost?.UserId == userId;

                case CommentableType.Guide:
                    var guide = await _context.Guides.FindAsync(comment.TargetEntityId);
                    return guide?.UserId == userId;

                case CommentableType.Game:
                case CommentableType.User:
                    // For games and users, only admins/moderators should be able to moderate
                    // For now, allow any user - this can be restricted later
                    return false; // Restrict for now

                default:
                    return false;
            }
        }

        private async Task ValidateCommentableEntityAsync(CommentableType commentableType, int entityId)
        {
            switch (commentableType)
            {
                case CommentableType.Game:
                    var game = await _context.Games.FindAsync(entityId);
                    if (game == null)
                        throw new InvalidOperationException("Oyun bulunamadı.");
                    break;

                case CommentableType.Guide:
                    var guide = await _context.Guides.FindAsync(entityId);
                    if (guide == null)
                        throw new InvalidOperationException("Kılavuz bulunamadı.");
                    break;

                case CommentableType.BlogPost:
                    var blog = await _context.BlogPosts.FindAsync(entityId);
                    if (blog == null)
                        throw new InvalidOperationException("Blog yazısı bulunamadı.");
                    break;

                case CommentableType.ForumTopic:
                    var topic = await _context.ForumTopics.FindAsync(entityId);
                    if (topic == null)
                        throw new InvalidOperationException("Forum konusu bulunamadı.");
                    break;

                case CommentableType.User:
                    var user = await _context.Users.FindAsync(entityId);
                    if (user == null || !user.IsActive)
                        throw new InvalidOperationException("Kullanıcı bulunamadı veya aktif değil.");
                    break;

                default:
                    throw new InvalidOperationException("Desteklenmeyen yorum tipi.");
            }
        }

        private async Task PopulateOwnerLikeFlags(List<CommentDto> comments, CommentableType commentableType, int entityId)
        {
            if (!comments.Any()) return;

            // Get the post owner's user info
            User? postOwner = null;
            string? ownerAvatarUrl = null;
            
            switch (commentableType)
            {
                case CommentableType.ForumTopic:
                    var forumTopic = await _context.ForumTopics.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == entityId);
                    postOwner = forumTopic?.User;
                    break;

                case CommentableType.BlogPost:
                    var blogPost = await _context.BlogPosts.Include(b => b.User).FirstOrDefaultAsync(b => b.Id == entityId);
                    postOwner = blogPost?.User;
                    break;

                case CommentableType.Guide:
                    var guide = await _context.Guides.Include(g => g.User).FirstOrDefaultAsync(g => g.Id == entityId);
                    postOwner = guide?.User;
                    break;
            }

            if (postOwner == null) return;
            
            ownerAvatarUrl = postOwner.AvatarUrl;

            var commentIds = GetAllCommentIds(comments);
            
            var ownerLikes = await _context.Likes
                .Where(l => l.LikableType == LikableType.Comment && 
                           commentIds.Contains(l.TargetEntityId) && 
                           l.UserId == postOwner.Id && 
                           l.IsLike && 
                           l.IsOwnerLike)
                .ToListAsync();

            foreach (var comment in comments)
            {
                PopulateCommentOwnerLikeFlags(comment, ownerLikes, ownerAvatarUrl);
            }
        }

        private void PopulateCommentOwnerLikeFlags(CommentDto comment, List<Like> ownerLikes, string? ownerAvatarUrl)
        {
            var ownerLike = ownerLikes.FirstOrDefault(l => l.TargetEntityId == comment.Id);
            if (ownerLike != null)
            {
                comment.HasOwnerLike = true;
                comment.OwnerAvatarUrl = ownerAvatarUrl;
            }

            // Recursively populate child comments
            foreach (var childComment in comment.ChildComments)
            {
                PopulateCommentOwnerLikeFlags(childComment, ownerLikes, ownerAvatarUrl);
            }
        }

        private async Task<bool> IsUserPostOwnerAsync(Comment comment, int userId)
        {
            switch (comment.CommentableType)
            {
                case CommentableType.ForumTopic:
                    var forumTopic = await _context.ForumTopics.FindAsync(comment.TargetEntityId);
                    return forumTopic?.UserId == userId;

                case CommentableType.BlogPost:
                    var blogPost = await _context.BlogPosts.FindAsync(comment.TargetEntityId);
                    return blogPost?.UserId == userId;

                case CommentableType.Guide:
                    var guide = await _context.Guides.FindAsync(comment.TargetEntityId);
                    return guide?.UserId == userId;

                case CommentableType.Game:
                case CommentableType.User:
                    return false; // For games and users, no specific owner

                default:
                    return false;
            }
        }

        private async Task SendCommentNotificationsAsync(Comment comment)
        {
            // Get entity details for notification
            var (entityTitle, entityOwnerId) = await GetEntityDetailsAsync(comment.CommentableType, comment.TargetEntityId);
            
            if (string.IsNullOrEmpty(entityTitle)) return;

            // Notify content owner (if different from comment author)
            if (entityOwnerId.HasValue && entityOwnerId.Value != comment.UserId)
            {
                var notificationType = GetCommentNotificationType(comment.CommentableType);
                await _notificationService.NotifyCommentAsync(
                    entityOwnerId.Value, 
                    comment.UserId, 
                    notificationType, 
                    comment.TargetEntityId, 
                    entityTitle, 
                    comment.Content
                );
            }

            // If this is a reply, notify the parent comment author
            if (comment.ParentCommentId.HasValue)
            {
                var parentComment = await _context.Comments.FindAsync(comment.ParentCommentId.Value);
                if (parentComment != null && parentComment.UserId != comment.UserId)
                {
                    await _notificationService.NotifyReplyAsync(
                        parentComment.UserId,
                        comment.UserId,
                        comment.Id,
                        parentComment.Id,
                        comment.Content
                    );
                }
            }

            // Handle @username mentions (only in regular comments, not replies)
            if (!comment.ParentCommentId.HasValue)
            {
                await ProcessMentionsAsync(comment.Content, comment.UserId, comment.TargetEntityId, comment.CommentableType.ToString());
            }
        }

        private async Task<(string title, int? ownerId)> GetEntityDetailsAsync(CommentableType commentableType, int entityId)
        {
            return commentableType switch
            {
                CommentableType.ForumTopic => await GetForumTopicDetailsAsync(entityId),
                CommentableType.BlogPost => await GetBlogPostDetailsAsync(entityId),
                CommentableType.Guide => await GetGuideDetailsAsync(entityId),
                CommentableType.Game => await GetGameDetailsAsync(entityId),
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

        private async Task<(string title, int? ownerId)> GetGameDetailsAsync(int id)
        {
            var game = await _context.Games.FindAsync(id);
            return game != null ? (game.Name, null) : ("", null); // Games don't have owners
        }

        private async Task ProcessMentionsAsync(string content, int mentionerUserId, int entityId, string entityType)
        {
            if (string.IsNullOrEmpty(content)) return;

            // Find all @username mentions using regex
            var mentionRegex = new System.Text.RegularExpressions.Regex(@"@(\w+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            var matches = mentionRegex.Matches(content);

            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                var username = match.Groups[1].Value;
                
                // Find the user by username
                var mentionedUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

                if (mentionedUser != null && mentionedUser.Id != mentionerUserId)
                {
                    // Send mention notification
                    await _notificationService.NotifyUserMentionedAsync(
                        mentionedUser.Id,
                        mentionerUserId,
                        entityId,
                        entityType,
                        content
                    );
                }
            }
        }

        private NotificationType GetCommentNotificationType(CommentableType commentableType)
        {
            return commentableType switch
            {
                CommentableType.ForumTopic => NotificationType.CommentOnForumTopic,
                CommentableType.BlogPost => NotificationType.CommentOnBlogPost,
                CommentableType.Guide => NotificationType.CommentOnGuide,
                _ => NotificationType.CommentOnForumTopic // Default fallback
            };
        }
    }
}