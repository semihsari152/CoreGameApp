using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Enums;
using InfrastructureLayer.Repositories;
using AutoMapper;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Services
{
    public class FavoriteService : IFavoriteService
    {
        private readonly FavoriteRepository _favoriteRepository;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public FavoriteService(FavoriteRepository favoriteRepository, IMapper mapper, AppDbContext context, INotificationService notificationService)
        {
            _favoriteRepository = favoriteRepository;
            _mapper = mapper;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<FavoriteDto>> GetUserFavoritesAsync(int userId, FavoriteType? favoriteType = null)
        {
            var favorites = await _favoriteRepository.GetUserFavoritesAsync(userId, favoriteType);
            return _mapper.Map<IEnumerable<FavoriteDto>>(favorites);
        }

        public async Task<FavoriteDto?> GetUserFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId)
        {
            var favorite = await _favoriteRepository.GetUserFavoriteAsync(userId, favoriteType, targetEntityId);
            return favorite != null ? _mapper.Map<FavoriteDto>(favorite) : null;
        }

        public async Task<FavoriteDto> CreateFavoriteAsync(int userId, CreateFavoriteDto createDto)
        {
            var favorite = new Favorite
            {
                UserId = userId,
                FavoriteType = createDto.FavoriteType,
                TargetEntityId = createDto.TargetEntityId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Favorites.Add(favorite);
            await _context.SaveChangesAsync();

            // Send notification
            try
            {
                await SendFavoriteNotificationAsync(userId, createDto.FavoriteType, createDto.TargetEntityId);
            }
            catch (Exception ex)
            {
                // Log notification error but don't fail the favorite operation
                Console.WriteLine($"Failed to send favorite notification: {ex.Message}");
            }

            // Reload with user info
            var created = await _favoriteRepository.GetUserFavoriteAsync(userId, createDto.FavoriteType, createDto.TargetEntityId);
            return _mapper.Map<FavoriteDto>(created!);
        }

        public async Task<bool> RemoveFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId)
        {
            return await _favoriteRepository.RemoveFavoriteAsync(userId, favoriteType, targetEntityId);
        }

        public async Task<(bool IsFavorited, FavoriteDto? Favorite)> ToggleFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId)
        {
            var existing = await _favoriteRepository.GetUserFavoriteAsync(userId, favoriteType, targetEntityId);
            
            if (existing != null)
            {
                // Remove favorite - no notification needed for removal
                await _favoriteRepository.RemoveFavoriteAsync(userId, favoriteType, targetEntityId);
                return (false, null);
            }
            else
            {
                // Add favorite - notification will be sent in CreateFavoriteAsync
                var createDto = new CreateFavoriteDto
                {
                    FavoriteType = favoriteType,
                    TargetEntityId = targetEntityId
                };
                var favorite = await CreateFavoriteAsync(userId, createDto);
                return (true, favorite);
            }
        }

        public async Task<bool> HasUserFavoritedAsync(int userId, FavoriteType favoriteType, int targetEntityId)
        {
            var favorite = await _favoriteRepository.GetUserFavoriteAsync(userId, favoriteType, targetEntityId);
            return favorite != null;
        }

        public async Task<int> GetFavoriteCountAsync(FavoriteType favoriteType, int targetEntityId)
        {
            return await _favoriteRepository.GetFavoriteCountAsync(favoriteType, targetEntityId);
        }

        private async Task SendFavoriteNotificationAsync(int triggerUserId, FavoriteType favoriteType, int entityId)
        {
            // Get entity details and target user based on favorite type
            var (entityTitle, targetUserId) = await GetEntityDetailsAsync(favoriteType, entityId);
            
            if (string.IsNullOrEmpty(entityTitle) || !targetUserId.HasValue) return;

            // Don't notify self
            if (targetUserId.Value == triggerUserId) return;

            await _notificationService.NotifyFavoriteAsync(
                targetUserId.Value,
                triggerUserId,
                favoriteType,
                entityId,
                entityTitle
            );
        }

        private async Task<(string title, int? ownerId)> GetEntityDetailsAsync(FavoriteType favoriteType, int entityId)
        {
            return favoriteType switch
            {
                FavoriteType.ForumTopic => await GetForumTopicDetailsAsync(entityId),
                FavoriteType.BlogPost => await GetBlogPostDetailsAsync(entityId),
                FavoriteType.Guide => await GetGuideDetailsAsync(entityId),
                FavoriteType.Game => await GetGameDetailsAsync(entityId),
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
    }
}