using DomainLayer.ExternalApiModels;

namespace DomainLayer.Interfaces
{
    public interface IIgdbApiService
    {
        Task<IEnumerable<IgdbGameModel>> SearchGamesAsync(string searchTerm, int limit = 10);
        Task<IgdbGameModel?> GetGameByIdAsync(int igdbId);
        Task<IEnumerable<IgdbGameModel>> GetPopularGamesAsync(int limit = 20);
        Task<IEnumerable<IgdbGameModel>> GetRecentGamesAsync(int limit = 20);
        Task<IEnumerable<IgdbGameModel>> GetGamesByGenreAsync(int genreId, int limit = 20);
        Task<IEnumerable<IgdbGameModel>> GetGamesByPlatformAsync(int platformId, int limit = 20);
        
        // Static data methods
        Task<string> GetGenresAsync();
        Task<string> GetThemesAsync();
        Task<string> GetGameModesAsync();
        Task<string> GetPlayerPerspectivesAsync();
        Task<string> GetPlatformsAsync();
        
        // HowLongToBeat data
        Task<IgdbTimeToBeat?> GetHowLongToBeatAsync(int gameIgdbId);
    }

    public interface ITwitchOAuthService
    {
        Task<string> GetAccessTokenAsync();
        Task<bool> ValidateTokenAsync(string token);
    }
}