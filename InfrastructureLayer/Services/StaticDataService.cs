using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace InfrastructureLayer.Services
{
    public class StaticDataService : IStaticDataService
    {
        private readonly AppDbContext _context;
        private readonly IIgdbApiService _igdbApiService;
        private readonly ILogger<StaticDataService> _logger;

        public StaticDataService(AppDbContext context, IIgdbApiService igdbApiService, ILogger<StaticDataService> logger)
        {
            _context = context;
            _igdbApiService = igdbApiService;
            _logger = logger;
        }

        public async Task PopulateAllStaticDataAsync()
        {
            _logger.LogInformation("Starting to populate all static data from IGDB");
            
            await PopulateGenresAsync();
            await PopulateThemesAsync();
            await PopulateGameModesAsync();
            await PopulatePlayerPerspectivesAsync();
            await PopulatePlatformsAsync();
            
            _logger.LogInformation("Finished populating all static data from IGDB");
        }

        public async Task PopulateGenresAsync()
        {
            try
            {
                _logger.LogInformation("Populating genres from IGDB");
                
                var genresJson = await _igdbApiService.GetGenresAsync();
                _logger.LogInformation("Received genres JSON: {Json}", genresJson);
                
                var igdbGenres = JsonConvert.DeserializeObject<List<IgdbStaticData>>(genresJson) ?? new List<IgdbStaticData>();
                _logger.LogInformation("Parsed {Count} genres from IGDB", igdbGenres.Count);
                
                int addedCount = 0;
                foreach (var igdbGenre in igdbGenres)
                {
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.IGDBId == igdbGenre.Id);
                    if (existingGenre == null)
                    {
                        var newGenre = new Genre
                        {
                            Name = igdbGenre.Name,
                            IGDBId = igdbGenre.Id,
                            IGDBName = igdbGenre.Name,
                            Description = $"Genre imported from IGDB"
                        };
                        
                        _context.Genres.Add(newGenre);
                        addedCount++;
                        _logger.LogInformation("Added genre: {Name} with IGDB ID: {Id}", igdbGenre.Name, igdbGenre.Id);
                    }
                    else
                    {
                        _logger.LogInformation("Genre already exists: {Name} with IGDB ID: {Id}", igdbGenre.Name, igdbGenre.Id);
                    }
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully populated {AddedCount} new genres out of {TotalCount} from IGDB", addedCount, igdbGenres.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error populating genres from IGDB");
                throw;
            }
        }

        public async Task PopulateThemesAsync()
        {
            try
            {
                _logger.LogInformation("Populating themes from IGDB");
                
                var themesJson = await _igdbApiService.GetThemesAsync();
                var igdbThemes = JsonConvert.DeserializeObject<List<IgdbStaticData>>(themesJson) ?? new List<IgdbStaticData>();
                
                foreach (var igdbTheme in igdbThemes)
                {
                    var existingTheme = await _context.Themes.FirstOrDefaultAsync(t => t.IGDBId == igdbTheme.Id);
                    if (existingTheme == null)
                    {
                        var newTheme = new Theme
                        {
                            Name = igdbTheme.Name,
                            IGDBId = igdbTheme.Id,
                            IGDBName = igdbTheme.Name,
                            Description = $"Theme imported from IGDB"
                        };
                        
                        _context.Themes.Add(newTheme);
                    }
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully populated {Count} themes", igdbThemes.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error populating themes from IGDB");
                throw;
            }
        }

        public async Task PopulateGameModesAsync()
        {
            try
            {
                _logger.LogInformation("Populating game modes from IGDB");
                
                var gameModesJson = await _igdbApiService.GetGameModesAsync();
                var igdbGameModes = JsonConvert.DeserializeObject<List<IgdbStaticData>>(gameModesJson) ?? new List<IgdbStaticData>();
                
                foreach (var igdbGameMode in igdbGameModes)
                {
                    var existingGameMode = await _context.GameModes.FirstOrDefaultAsync(gm => gm.IGDBId == igdbGameMode.Id);
                    if (existingGameMode == null)
                    {
                        var newGameMode = new GameMode
                        {
                            Name = igdbGameMode.Name,
                            IGDBId = igdbGameMode.Id,
                            IGDBName = igdbGameMode.Name,
                            Description = $"Game mode imported from IGDB"
                        };
                        
                        _context.GameModes.Add(newGameMode);
                    }
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully populated {Count} game modes", igdbGameModes.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error populating game modes from IGDB");
                throw;
            }
        }

        public async Task PopulatePlayerPerspectivesAsync()
        {
            try
            {
                _logger.LogInformation("Populating player perspectives from IGDB");
                
                var perspectivesJson = await _igdbApiService.GetPlayerPerspectivesAsync();
                var igdbPerspectives = JsonConvert.DeserializeObject<List<IgdbStaticData>>(perspectivesJson) ?? new List<IgdbStaticData>();
                
                foreach (var igdbPerspective in igdbPerspectives)
                {
                    var existingPerspective = await _context.PlayerPerspectives.FirstOrDefaultAsync(pp => pp.IGDBId == igdbPerspective.Id);
                    if (existingPerspective == null)
                    {
                        var newPerspective = new PlayerPerspective
                        {
                            Name = igdbPerspective.Name,
                            IGDBId = igdbPerspective.Id,
                            Description = $"Player perspective imported from IGDB"
                        };
                        
                        _context.PlayerPerspectives.Add(newPerspective);
                    }
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully populated {Count} player perspectives", igdbPerspectives.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error populating player perspectives from IGDB");
                throw;
            }
        }

        public async Task PopulatePlatformsAsync()
        {
            try
            {
                _logger.LogInformation("Populating platforms from IGDB");
                
                var platformsJson = await _igdbApiService.GetPlatformsAsync();
                var igdbPlatforms = JsonConvert.DeserializeObject<List<IgdbPlatformData>>(platformsJson) ?? new List<IgdbPlatformData>();
                
                foreach (var igdbPlatform in igdbPlatforms)
                {
                    var existingPlatform = await _context.Platforms.FirstOrDefaultAsync(p => p.IGDBId == igdbPlatform.Id);
                    if (existingPlatform == null)
                    {
                        var newPlatform = new DomainLayer.Entities.Platform
                        {
                            Name = igdbPlatform.Name,
                            IGDBId = igdbPlatform.Id,
                            IGDBName = igdbPlatform.Name,
                            Abbreviation = igdbPlatform.Abbreviation,
                            Description = $"Platform imported from IGDB"
                        };
                        
                        _context.Platforms.Add(newPlatform);
                    }
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully populated {Count} platforms", igdbPlatforms.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error populating platforms from IGDB");
                throw;
            }
        }
    }

    public class IgdbStaticData
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbPlatformData
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Abbreviation { get; set; }
    }
}