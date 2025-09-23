using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface ILikeRepository : IRepository<Like>
    {
        Task<IEnumerable<Like>> GetLikesByEntityAsync(LikableType type, int entityId);
        Task<IEnumerable<Like>> GetLikesByUserAsync(int userId);
        Task<Like?> GetUserLikeAsync(int userId, LikableType type, int entityId);
        Task<int> GetLikeCountAsync(LikableType type, int entityId, bool isLike);
        Task<bool> HasUserLikedAsync(int userId, LikableType type, int entityId);
        Task ToggleLikeAsync(int userId, LikableType type, int entityId, bool isLike);
    }
}