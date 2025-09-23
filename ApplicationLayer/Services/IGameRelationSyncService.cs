using DomainLayer.ExternalApiModels;

namespace ApplicationLayer.Services
{
    public interface IGameRelationSyncService
    {
        Task SyncGameRelationsFromIgdbAsync(int gameId, IgdbGameModel igdbGame);
        Task SyncGenresAsync(int gameId, IEnumerable<IgdbGenre> igdbGenres);
        Task SyncGameModesAsync(int gameId, IEnumerable<IgdbGameMode> igdbGameModes);
        Task SyncKeywordsAsync(int gameId, IEnumerable<IgdbKeyword> igdbKeywords);
        // Language sync removed as Language entity support has been removed
        Task SyncMediaAsync(int gameId, IgdbGameModel igdbGame);
        Task SyncPlatformsAsync(int gameId, IEnumerable<IgdbPlatform> igdbPlatforms);
        Task SyncGameSeriesAsync(int gameId, IgdbCollection? igdbCollection, IgdbFranchise? igdbFranchise);
        Task SyncThemesAsync(int gameId, IEnumerable<IgdbTheme> igdbThemes);
        Task SyncWebsitesAsync(int gameId, IEnumerable<IgdbWebsite> igdbWebsites);
    }
}