using ApplicationLayer.DTOs;
using DomainLayer.ExternalApiModels;

namespace ApplicationLayer.Services
{
    public interface IGameDataSyncService
    {
        // Admin Game Management
        Task<List<IgdbGameModel>> SearchGamesForAdminAsync(string searchTerm, int limit = 10);
        Task<GameDto> AddGameFromExternalAsync(int igdbId);
        Task<GameDto> AddGameFromSearchAsync(string gameName);
        
        // Data Synchronization
        Task SyncGameWithIgdbAsync(int gameId);
        Task SyncAllGamesAsync();
        
        // Rating Aggregation
        Task UpdateGameRatingAggregationAsync(int gameId);
        Task UpdateAllRatingAggregationsAsync();
        
        // Batch Operations
        Task ImportPopularGamesFromIgdbAsync(int limit = 50);
        Task ValidateGameDataIntegrityAsync();
        
        // Mapping and Matching
        Task<int?> FindIgdbIdByGameNameAsync(string gameName);
        
        // Data Health
        Task<Dictionary<string, object>> GetGameDataHealthAsync(int gameId);
        Task<Dictionary<string, object>> GetSystemDataHealthAsync();
    }
    
    public class GameDataHealthDto
    {
        public int GameId { get; set; }
        public string GameName { get; set; } = string.Empty;
        public bool HasIgdbData { get; set; }
        public bool HasSiteRatings { get; set; }
        public DateTime? LastIgdbSync { get; set; }
        public List<string> MissingData { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }
    
    public class SystemDataHealthDto
    {
        public int TotalGames { get; set; }
        public int GamesWithIgdbData { get; set; }
        public int GamesNeedingSync { get; set; }
        public DateTime LastFullSync { get; set; }
        public List<string> SystemRecommendations { get; set; } = new();
    }
}