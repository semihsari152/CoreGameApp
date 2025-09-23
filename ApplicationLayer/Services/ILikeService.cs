using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface ILikeService
    {
        Task<LikeDto?> GetLikeByIdAsync(int id);
        Task<IEnumerable<LikeDto>> GetLikesByEntityAsync(LikableType type, int entityId);
        Task<IEnumerable<LikeDto>> GetLikesByUserAsync(int userId);
        Task<LikeDto?> GetUserLikeAsync(int userId, LikableType type, int entityId);
        Task<int> GetLikeCountAsync(LikableType type, int entityId, bool isLike);
        Task<bool> HasUserLikedAsync(int userId, LikableType type, int entityId);
        Task<LikeDto> CreateLikeAsync(CreateLikeDto createLikeDto);
        Task DeleteLikeAsync(int id);
        Task ToggleLikeAsync(int userId, LikableType type, int entityId, bool isLike);
        Task<LikeStatsDto> GetLikeStatsAsync(LikableType type, int entityId);
    }
}