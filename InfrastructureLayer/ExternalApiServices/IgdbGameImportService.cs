using AutoMapper;
using DomainLayer.Entities;
using DomainLayer.Enums;
using DomainLayer.ExternalApiModels;
using DomainLayer.Interfaces;
using Microsoft.Extensions.Logging;
using ApplicationLayer.Utils;

namespace InfrastructureLayer.ExternalApiServices
{
    public class IgdbGameImportService : IIgdbGameImportService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IIgdbApiService _igdbApiService;
        private readonly IHowLongToBeatService _hltbService;
        private readonly IMapper _mapper;
        private readonly ILogger<IgdbGameImportService> _logger;

        public IgdbGameImportService(
            IUnitOfWork unitOfWork,
            IIgdbApiService igdbApiService,
            IHowLongToBeatService hltbService,
            IMapper mapper,
            ILogger<IgdbGameImportService> logger)
        {
            _unitOfWork = unitOfWork;
            _igdbApiService = igdbApiService;
            _hltbService = hltbService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<Game> ImportGameByIgdbIdAsync(int igdbId)
        {
            try
            {
                var existingGame = await _unitOfWork.Games.GetByIgdbIdAsync(igdbId);
                if (existingGame != null)
                {
                    _logger.LogInformation("Game with IGDB ID {IgdbId} already exists. For debugging, will reimport.", igdbId);
                    return existingGame;
                }

                var igdbGame = await _igdbApiService.GetGameByIdAsync(igdbId);
                if (igdbGame == null)
                {
                    throw new ArgumentException($"Game with IGDB ID {igdbId} not found in IGDB");
                }

                var game = await CreateGameFromIgdbDataAsync(igdbGame);
                await _unitOfWork.Games.AddAsync(game);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Successfully imported game {GameName} with IGDB ID {IgdbId}", game.Name, igdbId);
                return game;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing game with IGDB ID: {IgdbId}", igdbId);
                throw;
            }
        }

        private async Task<Game> CreateGameFromIgdbDataAsync(IgdbGameModel igdbGame)
        {
            // Generate unique slug for the game
            var baseSlug = SlugGenerator.GenerateSlug(igdbGame.Name);
            var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                _unitOfWork.Games.GetBySlugAsync(slug).Result != null);

            var game = new Game
            {
                Name = igdbGame.Name,
                Slug = uniqueSlug,
                Summary = igdbGame.Summary,
                Description = igdbGame.Summary,
                Storyline = igdbGame.Storyline,
                IGDBId = igdbGame.Id,
                ReleaseDate = igdbGame.ReleaseDate,
                IGDBSlug = igdbGame.Slug,
                IGDBUrl = igdbGame.Url,
                IGDBLastSync = DateTime.UtcNow,
                IGDBLastUpdated = igdbGame.LastUpdateDate,
                IsEarlyAccess = false, // Temporarily disabled
                
                // Rating Data moved to separate GameIgdbRating table
                
                // Media
                CoverImageId = igdbGame.Cover?.ImageId,
                CoverImageUrl = igdbGame.Cover?.FullUrl,
                
                // Time to Beat Info will be fetched separately
                
                // Data completion
                IsDataComplete = true,
                
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            // Add companies (developers/publishers)
            await AddGameCompaniesAsync(game, igdbGame);
            
            // Set backwards compatibility fields
            if (igdbGame.InvolvedCompanies?.Any() == true)
            {
                game.Developer = igdbGame.InvolvedCompanies.FirstOrDefault(ic => ic.Developer)?.Company?.Name;
                game.Publisher = igdbGame.InvolvedCompanies.FirstOrDefault(ic => ic.Publisher)?.Company?.Name;
            }

            // Language support removed as per refactoring requirements

            // Game Series temporarily disabled
            // TODO: Fix IGDB Collection/Franchise data fetching

            // Add platforms
            if (igdbGame.Platforms?.Any() == true)
            {
                foreach (var platformData in igdbGame.Platforms)
                {
                    var platform = await _unitOfWork.Platforms.GetOrCreateByIgdbIdAsync(platformData.Id, platformData.Name);
                    game.GamePlatforms.Add(new GamePlatform
                    {
                        Game = game,
                        PlatformId = platform.Id
                    });
                }
            }

            // Add genres
            await AddGameGenresAsync(game, igdbGame);

            // Add player perspectives
            await AddGamePlayerPerspectivesAsync(game, igdbGame);

            // Add game modes
            await AddGameModesAsync(game, igdbGame);

            // Add themes
            await AddGameThemesAsync(game, igdbGame);

            // Add keywords
            await AddGameKeywordsAsync(game, igdbGame);

            // Add websites
            await AddGameWebsitesAsync(game, igdbGame);

            // Add media (images and videos)
            await AddGameMediaAsync(game, igdbGame);

            // Fetch HowLongToBeat data from HLTB proxy API
            await AddHowLongToBeatDataAsync(game, igdbGame.Name);
            
            // Add IGDB rating data
            AddIgdbRatingData(game, igdbGame);

            return game;
        }

        private async Task AddGameMediaAsync(Game game, IgdbGameModel igdbGame)
        {
            // Add cover as primary image
            if (igdbGame.Cover != null)
            {
                game.GameMedia.Add(new GameMedia
                {
                    Game = game,
                    MediaType = MediaType.Cover,
                    Url = igdbGame.Cover.FullUrl,
                    ThumbnailUrl = igdbGame.Cover.ThumbUrl,
                    Title = "Cover Image",
                    IGDBId = igdbGame.Cover.Id,
                    Width = igdbGame.Cover.Width,
                    Height = igdbGame.Cover.Height,
                    IsPrimary = true
                });
            }

            // Add screenshots
            if (igdbGame.Screenshots?.Any() == true)
            {
                foreach (var screenshot in igdbGame.Screenshots)
                {
                    game.GameMedia.Add(new GameMedia
                    {
                        Game = game,
                        MediaType = MediaType.Screenshot,
                        Url = screenshot.FullUrl,
                        ThumbnailUrl = screenshot.ThumbUrl,
                        Title = "Screenshot",
                        IGDBId = screenshot.Id,
                        Width = screenshot.Width,
                        Height = screenshot.Height,
                        IsPrimary = false
                    });
                }
            }

            // Add artworks
            if (igdbGame.Artworks?.Any() == true)
            {
                foreach (var artwork in igdbGame.Artworks)
                {
                    game.GameMedia.Add(new GameMedia
                    {
                        Game = game,
                        MediaType = MediaType.Artwork,
                        Url = artwork.FullUrl,
                        ThumbnailUrl = artwork.ThumbUrl,
                        Title = "Artwork",
                        IGDBId = artwork.Id,
                        Width = artwork.Width,
                        Height = artwork.Height,
                        IsPrimary = false
                    });
                }
            }

            // Add videos
            if (igdbGame.Videos?.Any() == true)
            {
                foreach (var video in igdbGame.Videos)
                {
                    game.GameMedia.Add(new GameMedia
                    {
                        Game = game,
                        MediaType = MediaType.Video,
                        Url = $"https://www.youtube.com/watch?v={video.VideoId}",
                        Title = video.Name ?? "Game Video",
                        Description = video.Name
                    });
                }
            }
        }

        private async Task<GameSeries> GetOrCreateGameSeriesAsync(string name)
        {
            var series = await _unitOfWork.GameSeries.GetByNameAsync(name);
            if (series == null)
            {
                series = new GameSeries
                {
                    Name = name,
                    CreatedDate = DateTime.UtcNow
                };
                await _unitOfWork.GameSeries.AddAsync(series);
                await _unitOfWork.SaveChangesAsync(); // Save immediately to get the ID
                _logger.LogInformation("Created new GameSeries: {SeriesName} with ID: {SeriesId}", name, series.Id);
            }
            return series;
        }


        private async Task<Keyword> GetOrCreateKeywordAsync(string name, int igdbId)
        {
            var keyword = await _unitOfWork.Repository<Keyword>().GetFirstOrDefaultAsync(k => k.IGDBId == igdbId);
            if (keyword == null)
            {
                keyword = await _unitOfWork.Repository<Keyword>().GetFirstOrDefaultAsync(k => k.Name == name);
                if (keyword == null)
                {
                    keyword = new Keyword
                    {
                        Name = name,
                        IGDBId = igdbId,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<Keyword>().AddAsync(keyword);
                    await _unitOfWork.SaveAsync();
                }
            }
            return keyword;
        }

        private WebsiteType? MapIgdbWebsiteTypeToEnum(int category)
        {
            return category switch
            {
                1 => WebsiteType.Official,
                2 => WebsiteType.Wikia,
                3 => WebsiteType.Wikipedia,
                4 => WebsiteType.Facebook,
                5 => WebsiteType.Twitter,
                6 => WebsiteType.Twitch,
                8 => WebsiteType.Instagram,
                9 => WebsiteType.YouTube,
                10 => WebsiteType.iPhone,
                11 => WebsiteType.iPad,
                12 => WebsiteType.Android,
                13 => WebsiteType.Steam,
                14 => WebsiteType.Reddit,
                15 => WebsiteType.Itch,
                16 => WebsiteType.EpicGames,
                17 => WebsiteType.GOG,
                18 => WebsiteType.Discord,
                _ => null
            };
        }

        private async Task AddGameCompaniesAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.InvolvedCompanies?.Any() == true)
            {
                foreach (var involvedCompany in igdbGame.InvolvedCompanies)
                {
                    var company = await GetOrCreateCompanyAsync(involvedCompany.Company.Name, involvedCompany.Company.Id);
                    game.GameCompanies.Add(new GameCompany
                    {
                        Game = game,
                        CompanyId = company.Id,
                        IsDeveloper = involvedCompany.Developer,
                        IsPublisher = involvedCompany.Publisher
                    });
                }
            }
        }

        // AddGameLanguagesAsync method removed as Language entity support has been removed

        private async Task AddGameGenresAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.Genres?.Any() == true)
            {
                foreach (var genreData in igdbGame.Genres)
                {
                    var genre = await _unitOfWork.Genres.GetOrCreateByIgdbIdAsync(genreData.Id, genreData.Name);
                    // Genre is always created/found now
                    game.GameGenres.Add(new GameGenre
                    {
                        Game = game,
                        GenreId = genre.Id
                    });
                }
            }
        }

        private async Task AddGamePlayerPerspectivesAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.PlayerPerspectives?.Any() == true)
            {
                foreach (var perspectiveData in igdbGame.PlayerPerspectives)
                {
                    var perspective = await GetOrCreatePlayerPerspectiveAsync(perspectiveData.Name, perspectiveData.Id);
                    game.GamePlayerPerspectives.Add(new GamePlayerPerspective
                    {
                        Game = game,
                        PlayerPerspectiveId = perspective.Id
                    });
                }
            }
        }

        private async Task AddGameModesAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.GameModes?.Any() == true)
            {
                foreach (var gameModeData in igdbGame.GameModes)
                {
                    var gameMode = await _unitOfWork.GameModes.GetOrCreateByIgdbIdAsync(gameModeData.Id, gameModeData.Name);
                    game.GameGameModes.Add(new GameGameMode
                    {
                        Game = game,
                        GameModeId = gameMode.Id
                    });
                }
            }
        }

        private async Task AddGameThemesAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.Themes?.Any() == true)
            {
                foreach (var themeData in igdbGame.Themes)
                {
                    var theme = await _unitOfWork.Themes.GetOrCreateByIgdbIdAsync(themeData.Id, themeData.Name);
                    game.GameThemes.Add(new GameTheme
                    {
                        Game = game,
                        ThemeId = theme.Id
                    });
                }
            }
        }

        private async Task AddGameKeywordsAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.Keywords?.Any() == true)
            {
                foreach (var keywordData in igdbGame.Keywords)
                {
                    var keyword = await _unitOfWork.Keywords.GetOrCreateByIgdbIdAsync(keywordData.Id, keywordData.Name);
                    game.GameKeywords.Add(new GameKeyword
                    {
                        Game = game,
                        KeywordId = keyword.Id
                    });
                }
            }
        }

        private async Task AddGameWebsitesAsync(Game game, IgdbGameModel igdbGame)
        {
            if (igdbGame.Websites?.Any() == true)
            {
                foreach (var websiteData in igdbGame.Websites)
                {
                    var websiteType = MapIgdbWebsiteTypeToEnum(websiteData.Category);
                    if (websiteType.HasValue)
                    {
                        game.GameWebsites.Add(new GameWebsite
                        {
                            Game = game,
                            Url = websiteData.Url,
                            WebsiteType = websiteType.Value
                        });
                    }
                }
            }
        }

        private async Task<Company> GetOrCreateCompanyAsync(string name, int igdbId)
        {
            // First check if company exists by IGDB ID
            var company = await _unitOfWork.Repository<Company>().GetFirstOrDefaultAsync(c => c.IGDBId == igdbId);
            if (company == null)
            {
                // Check by name as fallback
                company = await _unitOfWork.Repository<Company>().GetFirstOrDefaultAsync(c => c.Name == name);
                if (company == null)
                {
                    company = new Company
                    {
                        Name = name,
                        IGDBId = igdbId,
                        CreatedDate = DateTime.UtcNow,
                        UpdatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<Company>().AddAsync(company);
                    await _unitOfWork.SaveAsync();
                }
            }
            return company;
        }


        private async Task<Genre> GetOrCreateGenreAsync(string name, int igdbId)
        {
            // First try to find by IGDB ID (this is the primary key for matching)
            var genre = await _unitOfWork.Genres.GetByIgdbIdAsync(igdbId);
            if (genre != null)
            {
                // Update IGDB name if needed
                if (genre.IGDBName != name)
                {
                    genre.IGDBName = name;
                    await _unitOfWork.SaveAsync();
                }
                return genre;
            }

            // If not found by IGDB ID, do NOT create new genre
            // Log this as it might indicate a missing genre in our static data
            _logger.LogWarning("Genre with IGDB ID {IgdbId} and name '{Name}' not found in database. Skipping to prevent duplicate genres.", igdbId, name);
            return null; // Return null to skip this genre
        }

        private async Task<PlayerPerspective> GetOrCreatePlayerPerspectiveAsync(string name, int igdbId)
        {
            var perspective = await _unitOfWork.Repository<PlayerPerspective>().GetFirstOrDefaultAsync(p => p.IGDBId == igdbId);
            if (perspective == null)
            {
                perspective = await _unitOfWork.Repository<PlayerPerspective>().GetFirstOrDefaultAsync(p => p.Name == name);
                if (perspective == null)
                {
                    perspective = new PlayerPerspective
                    {
                        Name = name,
                        IGDBId = igdbId,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<PlayerPerspective>().AddAsync(perspective);
                    await _unitOfWork.SaveAsync();
                }
            }
            return perspective;
        }

        private async Task<GameMode> GetOrCreateGameModeAsync(string name, int igdbId)
        {
            var gameMode = await _unitOfWork.GameModes.GetByIgdbIdAsync(igdbId);
            if (gameMode == null)
            {
                gameMode = await _unitOfWork.Repository<GameMode>().GetFirstOrDefaultAsync(g => g.Name == name);
                if (gameMode == null)
                {
                    gameMode = new GameMode
                    {
                        Name = name,
                        IGDBId = igdbId,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<GameMode>().AddAsync(gameMode);
                    await _unitOfWork.SaveAsync();
                }
            }
            return gameMode;
        }

        private async Task<Theme> GetOrCreateThemeAsync(string name, int igdbId)
        {
            var theme = await _unitOfWork.Themes.GetByIgdbIdAsync(igdbId);
            if (theme == null)
            {
                theme = await _unitOfWork.Repository<Theme>().GetFirstOrDefaultAsync(t => t.Name == name);
                if (theme == null)
                {
                    theme = new Theme
                    {
                        Name = name,
                        IGDBId = igdbId,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<Theme>().AddAsync(theme);
                    await _unitOfWork.SaveAsync();
                }
            }
            return theme;
        }

        private async Task<DomainLayer.Entities.Platform> GetExistingPlatformByIgdbIdAsync(int igdbId)
        {
            return await _unitOfWork.Repository<DomainLayer.Entities.Platform>().GetFirstOrDefaultAsync(p => p.IGDBId == igdbId);
        }

        private bool CheckIfEarlyAccess(IgdbGameModel igdbGame)
        {
            _logger.LogInformation("Checking Early Access for game {GameName} (IGDB ID: {IgdbId})", igdbGame.Name, igdbGame.Id);
            
            // Log all release dates for debugging
            if (igdbGame.ReleaseDates?.Any() == true)
            {
                _logger.LogInformation("Game {GameName} has {Count} release dates:", igdbGame.Name, igdbGame.ReleaseDates.Count);
                foreach (var rd in igdbGame.ReleaseDates)
                {
                    _logger.LogInformation("  - Platform: {Platform}, Status: {Status}, Date: {Date}", 
                        rd.Platform?.Name ?? "Unknown", rd.Status, rd.Date);
                }
                
                var hasEarlyAccess = igdbGame.ReleaseDates.Any(rd => rd.Status == 4);
                if (hasEarlyAccess)
                {
                    _logger.LogInformation("Game {GameName} detected as Early Access based on release date status", igdbGame.Name);
                    return true;
                }
            }
            else
            {
                _logger.LogWarning("Game {GameName} has no release dates", igdbGame.Name);
            }

            // Log category info
            _logger.LogInformation("Game {GameName} has category: {Category}", igdbGame.Name, igdbGame.Category);

            _logger.LogInformation("Game {GameName} is NOT Early Access", igdbGame.Name);
            return false;
        }

        private async Task AddHowLongToBeatDataAsync(Game game, string gameName)
        {
            try
            {
                _logger.LogInformation("Fetching HLTB data for game: {GameName}", gameName);
                var hltbData = await _hltbService.GetGameDataAsync(gameName);
                if (hltbData != null && hltbData.BeatTime != null)
                {
                    // Create GameBeatTime entity with all beat time data
                    var gameBeatTime = new GameBeatTime
                    {
                        GameId = game.Id,
                        
                        // Main Story
                        MainAvgSeconds = hltbData.BeatTime.Main?.AvgSeconds,
                        MainPolledCount = hltbData.BeatTime.Main?.PolledCount,
                        
                        // Main + Extras
                        ExtraAvgSeconds = hltbData.BeatTime.Extra?.AvgSeconds,
                        ExtraPolledCount = hltbData.BeatTime.Extra?.PolledCount,
                        
                        // Completionist
                        CompletionistAvgSeconds = hltbData.BeatTime.Completionist?.AvgSeconds,
                        CompletionistPolledCount = hltbData.BeatTime.Completionist?.PolledCount,
                        
                        // All Styles
                        AllAvgSeconds = hltbData.BeatTime.All?.AvgSeconds,
                        AllPolledCount = hltbData.BeatTime.All?.PolledCount,
                        
                        // HLTB Source Info
                        HltbGameName = hltbData.GameName,
                        HltbGameId = hltbData.GameId,
                        LastUpdated = DateTime.UtcNow
                    };

                    // Set the navigation property
                    game.GameBeatTime = gameBeatTime;

                    _logger.LogInformation("✅ Added HLTB data for game {GameName}: Main={MainHours}h, Extra={ExtraHours}h, Complete={CompleteHours}h, All={AllHours}h", 
                        gameName, gameBeatTime.MainHours, gameBeatTime.ExtraHours, gameBeatTime.CompletionistHours, gameBeatTime.AllHours);
                }
                else
                {
                    _logger.LogWarning("❌ No HLTB data found for game: {GameName}", gameName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Could not fetch HowLongToBeat data for game {GameName}", gameName);
                // Don't throw, just log warning and continue
            }
        }
        
        private void AddIgdbRatingData(Game game, IgdbGameModel igdbGame)
        {
            try
            {
                _logger.LogInformation("Adding IGDB rating data for game: {GameName}", igdbGame.Name);
                
                // Create GameIgdbRating entity with IGDB rating data
                var gameIgdbRating = new GameIgdbRating
                {
                    GameId = game.Id,
                    
                    // User Rating (IGDB community rating)
                    UserRating = igdbGame.Rating,
                    UserRatingCount = igdbGame.RatingCount,
                    
                    // Critic Rating (IGDB aggregated critic scores)
                    CriticRating = igdbGame.AggregatedRating,
                    CriticRatingCount = igdbGame.AggregatedRatingCount,
                    
                    // Sync info
                    LastUpdated = DateTime.UtcNow,
                    IgdbLastSync = DateTime.UtcNow
                };

                // Set the navigation property
                game.GameIgdbRating = gameIgdbRating;

                _logger.LogInformation("✅ Added IGDB rating data for game {GameName}: UserRating={UserRating}/100 ({UserRatingDisplay}/10, {UserCount} votes), CriticRating={CriticRating}/100 ({CriticRatingDisplay}/10, {CriticCount} reviews)", 
                    igdbGame.Name, 
                    gameIgdbRating.UserRating, gameIgdbRating.UserRatingDisplay, gameIgdbRating.UserRatingCount,
                    gameIgdbRating.CriticRating, gameIgdbRating.CriticRatingDisplay, gameIgdbRating.CriticRatingCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Could not add IGDB rating data for game {GameName}", igdbGame.Name);
                // Don't throw, just log warning and continue
            }
        }
    }
}