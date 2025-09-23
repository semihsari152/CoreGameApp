using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface IFavoriteService
    {
        Task<IEnumerable<FavoriteDto>> GetUserFavoritesAsync(int userId, FavoriteType? favoriteType = null);
        Task<FavoriteDto?> GetUserFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId);
        Task<FavoriteDto> CreateFavoriteAsync(int userId, CreateFavoriteDto createDto);
        Task<bool> RemoveFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId);
        Task<(bool IsFavorited, FavoriteDto? Favorite)> ToggleFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId);
        Task<bool> HasUserFavoritedAsync(int userId, FavoriteType favoriteType, int targetEntityId);
        Task<int> GetFavoriteCountAsync(FavoriteType favoriteType, int targetEntityId);
    }
}