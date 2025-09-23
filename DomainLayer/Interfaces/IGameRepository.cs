using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameRepository : IRepository<Game>
    {
        Task<IEnumerable<Game>> GetGamesByNameAsync(string name);
        Task<IEnumerable<Game>> GetGamesByGenreAsync(int genreId);
        Task<IEnumerable<Game>> GetGamesByPlatformAsync(Enums.Platform platform);
        Task<IEnumerable<Game>> GetTopRatedGamesAsync(int count);
        Task<IEnumerable<Game>> GetRecentGamesAsync(int count);
        Task<IEnumerable<Game>> SearchGamesAsync(string searchTerm);
        Task<Game?> GetByIGDBIdAsync(int igdbId);
        Task UpdateAverageRatingAsync(int gameId);
        
        // New methods for external API sync
        Task<Game?> GetByIgdbIdAsync(int igdbId);
        Task<Game?> GetBySlugAsync(string slug);
        Task<IEnumerable<Game>> GetGamesWithIgdbIdAsync();
        Task<IEnumerable<Game>> GetGamesNeedingSyncAsync();
    }
}