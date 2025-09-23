using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using AutoMapper;
using DomainLayer.Entities;
using DomainLayer.ExternalApiModels;
using DomainLayer.Interfaces;
using Microsoft.Extensions.Logging;

namespace InfrastructureLayer.Services
{
    public class GameDataSyncService : IGameDataSyncService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IIgdbApiService _igdbApiService;
        private readonly IIgdbGameImportService _igdbGameImportService;
        private readonly IMapper _mapper;
        private readonly ILogger<GameDataSyncService> _logger;

        public GameDataSyncService(
            IUnitOfWork unitOfWork,
            IIgdbApiService igdbApiService,
            IIgdbGameImportService igdbGameImportService,
            IMapper mapper,
            ILogger<GameDataSyncService> logger)
        {
            _unitOfWork = unitOfWork;
            _igdbApiService = igdbApiService;
            _igdbGameImportService = igdbGameImportService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<IgdbGameModel>> SearchGamesForAdminAsync(string searchTerm, int limit = 10)
        {
            try
            {
                var games = await _igdbApiService.SearchGamesAsync(searchTerm, limit);
                return games.ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching games for admin with term: {SearchTerm}", searchTerm);
                throw;
            }
        }

        public async Task<GameDto> AddGameFromExternalAsync(int igdbId)
        {
            try
            {
                var game = await _igdbGameImportService.ImportGameByIgdbIdAsync(igdbId);
                
                // Relations are already handled in IgdbGameImportService
                
                var gameDto = _mapper.Map<GameDto>(game);
                
                _logger.LogInformation("Successfully added game from external API with relations: {GameName} (IGDB ID: {IgdbId})", 
                    game.Name, igdbId);
                
                return gameDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding game from external API with IGDB ID: {IgdbId}", igdbId);
                throw;
            }
        }

        public async Task<GameDto> AddGameFromSearchAsync(string gameName)
        {
            try
            {
                var searchResults = await _igdbApiService.SearchGamesAsync(gameName, 1);
                var firstResult = searchResults.FirstOrDefault();
                
                if (firstResult == null)
                {
                    throw new InvalidOperationException($"No games found with name: {gameName}");
                }

                return await AddGameFromExternalAsync(firstResult.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding game from search with name: {GameName}", gameName);
                throw;
            }
        }

        public async Task SyncGameWithIgdbAsync(int gameId)
        {
            try
            {
                var game = await _unitOfWork.Games.GetByIdAsync(gameId);
                if (game == null || !game.IGDBId.HasValue)
                {
                    _logger.LogWarning("Game not found or has no IGDB ID: {GameId}", gameId);
                    return;
                }

                var igdbGame = await _igdbApiService.GetGameByIdAsync(game.IGDBId.Value);
                if (igdbGame == null)
                {
                    _logger.LogWarning("IGDB game not found: {IgdbId}", game.IGDBId.Value);
                    return;
                }

                // Update game with fresh IGDB data
                game.Name = igdbGame.Name;
                game.Description = !string.IsNullOrEmpty(igdbGame.Summary) ? igdbGame.Summary : igdbGame.Storyline;
                game.Storyline = igdbGame.Storyline;
                game.ReleaseDate = igdbGame.ReleaseDate;
                game.CoverImageUrl = igdbGame.Cover?.FullUrl;
                game.IGDBLastSync = DateTime.UtcNow;
                game.UpdatedDate = DateTime.UtcNow;

                // Update IGDB rating data in separate GameIgdbRating table
                if (game.GameIgdbRating == null)
                {
                    game.GameIgdbRating = new GameIgdbRating { GameId = game.Id };
                }
                
                game.GameIgdbRating.CriticRating = igdbGame.AggregatedRating;
                game.GameIgdbRating.CriticRatingCount = igdbGame.AggregatedRatingCount;
                game.GameIgdbRating.UserRating = igdbGame.Rating;
                game.GameIgdbRating.UserRatingCount = igdbGame.RatingCount;
                game.GameIgdbRating.LastUpdated = DateTime.UtcNow;
                game.GameIgdbRating.IgdbLastSync = DateTime.UtcNow;

                _unitOfWork.Games.Update(game);
                await _unitOfWork.SaveChangesAsync();

                // Relations are already handled in IgdbGameImportService

                _logger.LogInformation("Successfully synced game {GameId} with IGDB data including relations", gameId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing game {GameId} with IGDB", gameId);
                throw;
            }
        }

        public async Task SyncAllGamesAsync()
        {
            try
            {
                var games = await _unitOfWork.Games.GetAllAsync();
                var gamesWithIgdbId = games.Where(g => g.IGDBId.HasValue).ToList();

                _logger.LogInformation("Starting sync for {Count} games with IGDB IDs", gamesWithIgdbId.Count);

                foreach (var game in gamesWithIgdbId)
                {
                    try
                    {
                        await SyncGameWithIgdbAsync(game.Id);
                        
                        // Add delay to respect API rate limits
                        await Task.Delay(250); // 4 requests per second max
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to sync game {GameId}", game.Id);
                        // Continue with other games
                    }
                }

                _logger.LogInformation("Completed sync for all games");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk game sync");
                throw;
            }
        }

        public async Task UpdateGameRatingAggregationAsync(int gameId)
        {
            try
            {
                var game = await _unitOfWork.Games.GetByIdAsync(gameId);
                if (game == null)
                {
                    _logger.LogWarning("Game not found: {GameId}", gameId);
                    return;
                }

                var allRatings = await _unitOfWork.Repository<GameRating>().GetAllAsync();
                var siteRatings = allRatings.Where(r => r.GameId == gameId);
                
                // User ratings are now separate from IGDB ratings
                // No need to update Game entity as user ratings are handled separately in GameRating table

                game.UpdatedDate = DateTime.UtcNow;
                _unitOfWork.Games.Update(game);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Updated rating aggregation for game {GameId}", gameId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rating aggregation for game {GameId}", gameId);
                throw;
            }
        }

        public async Task UpdateAllRatingAggregationsAsync()
        {
            try
            {
                var games = await _unitOfWork.Games.GetAllAsync();
                
                foreach (var game in games)
                {
                    await UpdateGameRatingAggregationAsync(game.Id);
                }

                _logger.LogInformation("Completed rating aggregation update for all games");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk rating aggregation update");
                throw;
            }
        }

        public async Task ImportPopularGamesFromIgdbAsync(int limit = 50)
        {
            try
            {
                var popularGames = await _igdbApiService.GetPopularGamesAsync(limit);
                
                foreach (var igdbGame in popularGames)
                {
                    var existingGame = await _unitOfWork.Games.GetByIgdbIdAsync(igdbGame.Id);
                    if (existingGame == null)
                    {
                        // Import new game
                        await _igdbGameImportService.ImportGameByIgdbIdAsync(igdbGame.Id);
                        
                        // Add delay to respect API rate limits
                        await Task.Delay(250);
                    }
                }

                _logger.LogInformation("Successfully imported popular games from IGDB");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing popular games from IGDB");
                throw;
            }
        }

        public async Task ValidateGameDataIntegrityAsync()
        {
            try
            {
                var games = await _unitOfWork.Games.GetAllAsync();
                var issues = new List<string>();

                foreach (var game in games)
                {
                    if (string.IsNullOrEmpty(game.Name))
                        issues.Add($"Game {game.Id} has no name");
                    
                    if (!game.IGDBId.HasValue)
                        issues.Add($"Game {game.Id} ({game.Name}) has no IGDB ID");
                    
                    if (game.ReleaseDate == null)
                        issues.Add($"Game {game.Id} ({game.Name}) has no release date");
                    
                    if (string.IsNullOrEmpty(game.Description))
                        issues.Add($"Game {game.Id} ({game.Name}) has no description");
                }

                if (issues.Any())
                {
                    _logger.LogWarning("Found {Count} data integrity issues", issues.Count);
                    foreach (var issue in issues)
                    {
                        _logger.LogWarning("Data integrity issue: {Issue}", issue);
                    }
                }
                else
                {
                    _logger.LogInformation("No data integrity issues found");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during data integrity validation");
                throw;
            }
        }

        public async Task<int?> FindIgdbIdByGameNameAsync(string gameName)
        {
            try
            {
                var searchResults = await _igdbApiService.SearchGamesAsync(gameName, 1);
                return searchResults.FirstOrDefault()?.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding IGDB ID for game: {GameName}", gameName);
                return null;
            }
        }

        public async Task<Dictionary<string, object>> GetGameDataHealthAsync(int gameId)
        {
            try
            {
                var game = await _unitOfWork.Games.GetByIdAsync(gameId);
                if (game == null)
                {
                    throw new ArgumentException($"Game with ID {gameId} not found");
                }

                var health = new Dictionary<string, object>
                {
                    ["GameId"] = gameId,
                    ["GameName"] = game.Name,
                    ["HasIgdbData"] = game.IGDBId.HasValue,
                    ["HasSiteRatings"] = game.GameRatings?.Any() == true,
                    ["LastIgdbSync"] = game.IGDBLastSync,
                    ["MissingData"] = new List<string>(),
                    ["Recommendations"] = new List<string>()
                };

                var missingData = (List<string>)health["MissingData"];
                var recommendations = (List<string>)health["Recommendations"];

                if (!game.IGDBId.HasValue)
                    missingData.Add("IGDB data");
                
                if (string.IsNullOrEmpty(game.Description))
                    missingData.Add("Description");
                
                if (game.ReleaseDate == null)
                    missingData.Add("Release date");
                
                if (string.IsNullOrEmpty(game.CoverImageUrl))
                    missingData.Add("Cover image");

                if (game.IGDBId.HasValue && (!game.IGDBLastSync.HasValue || game.IGDBLastSync < DateTime.UtcNow.AddDays(-30)))
                    recommendations.Add("Sync with IGDB (data is older than 30 days)");

                return health;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting game data health for game {GameId}", gameId);
                throw;
            }
        }

        public async Task<Dictionary<string, object>> GetSystemDataHealthAsync()
        {
            try
            {
                var games = await _unitOfWork.Games.GetAllAsync();
                
                var health = new Dictionary<string, object>
                {
                    ["TotalGames"] = games.Count(),
                    ["GamesWithIgdbData"] = games.Count(g => g.IGDBId.HasValue),
                    ["GamesNeedingSync"] = games.Count(g => g.IGDBId.HasValue && 
                        (!g.IGDBLastSync.HasValue || g.IGDBLastSync < DateTime.UtcNow.AddDays(-30))),
                    ["LastFullSync"] = DateTime.MinValue, // This could be stored in a settings table
                    ["SystemRecommendations"] = new List<string>()
                };

                var systemRecommendations = (List<string>)health["SystemRecommendations"];
                var gamesNeedingSync = (int)health["GamesNeedingSync"];
                var totalGames = (int)health["TotalGames"];
                var gamesWithIgdbData = (int)health["GamesWithIgdbData"];

                if (gamesNeedingSync > 0)
                    systemRecommendations.Add($"{gamesNeedingSync} games need IGDB sync");
                
                if (gamesWithIgdbData < totalGames)
                    systemRecommendations.Add($"{totalGames - gamesWithIgdbData} games missing IGDB data");

                return health;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system data health");
                throw;
            }
        }
    }
}