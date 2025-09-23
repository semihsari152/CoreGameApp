using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGuideRepository : IRepository<Guide>
    {
        Task<IEnumerable<Guide>> GetGuidesByGameAsync(int gameId);
        Task<IEnumerable<Guide>> GetGuidesByUserAsync(int userId);
        Task<IEnumerable<Guide>> GetPublishedGuidesAsync();
        Task<IEnumerable<Guide>> GetTopRatedGuidesAsync(int count);
        Task<IEnumerable<Guide>> GetRecentGuidesAsync(int count);
        Task<IEnumerable<Guide>> SearchGuidesAsync(string searchTerm);
        Task IncrementViewCountAsync(int guideId);
        Task UpdateAverageRatingAsync(int guideId);
    }
}