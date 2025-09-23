using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;
using System.Security.Claims;
using static ApplicationLayer.DTOs.GameDto;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly AppDbContext _context;
        private readonly IGameService _gameService;
        private readonly IGameDataSyncService _gameDataSyncService;

        public GamesController(IUnitOfWork unitOfWork, AppDbContext context, IGameService gameService, IGameDataSyncService gameDataSyncService)
        {
            _unitOfWork = unitOfWork;
            _context = context;
            _gameService = gameService;
            _gameDataSyncService = gameDataSyncService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllGames([FromQuery] string? searchTerm = null, [FromQuery] List<int>? genreIds = null, [FromQuery] List<string>? platforms = null, [FromQuery] string? sortBy = "popularity", [FromQuery] string? sortOrder = "desc", [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            try
            {
                var query = _context.Games
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameGameModes)
                        .ThenInclude(ggm => ggm.GameMode)
                    .Include(g => g.GamePlayerPerspectives)
                        .ThenInclude(gpp => gpp.PlayerPerspective)
                    .Include(g => g.GameRatings)
                    .Include(g => g.GameIgdbRating)
                    .AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(g => g.Name.Contains(searchTerm) || (g.Description != null && g.Description.Contains(searchTerm)));
                }

                // Apply genre filter
                if (genreIds != null && genreIds.Any())
                {
                    query = query.Where(g => g.GameGenres.Any(gg => genreIds.Contains(gg.GenreId)));
                }

                // Apply platform filter
                if (platforms != null && platforms.Any())
                {
                    query = query.Where(g => g.GamePlatforms.Any(gp => platforms.Contains(gp.Platform.Name)));
                }

                // Apply sorting
                query = sortBy?.ToLower() switch
                {
                    "popularity" => sortOrder == "asc" ? query.OrderBy(g => g.GameRatings.Count()) : query.OrderByDescending(g => g.GameRatings.Count()),
                    "rating" => sortOrder == "asc" ? query.OrderBy(g => g.GameRatings.Average(r => (double?)r.Rating) ?? 0) : query.OrderByDescending(g => g.GameRatings.Average(r => (double?)r.Rating) ?? 0),
                    "releasedate" => sortOrder == "asc" ? query.OrderBy(g => g.ReleaseDate) : query.OrderByDescending(g => g.ReleaseDate),
                    "name" => sortOrder == "asc" ? query.OrderBy(g => g.Name) : query.OrderByDescending(g => g.Name),
                    _ => query.OrderByDescending(g => g.GameRatings.Count())
                };

                var totalCount = await query.CountAsync();
                var games = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Slug,
                        g.Description,
                        g.Summary,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        g.CreatedDate,
                        g.UpdatedDate,
                        g.IGDBId,
                        g.IsEarlyAccess,
                        g.GameSeriesId,
                        AverageRating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        RatingCount = g.GameRatings.Count(),
                        IgdbUserRating = g.GameIgdbRating != null && g.GameIgdbRating.UserRating.HasValue ? (double?)(g.GameIgdbRating.UserRating.Value / 10.0m) : null,
                        IgdbUserRatingCount = g.GameIgdbRating != null ? g.GameIgdbRating.UserRatingCount : null,
                        IgdbCriticsRating = g.GameIgdbRating != null && g.GameIgdbRating.CriticRating.HasValue ? (double?)(g.GameIgdbRating.CriticRating.Value / 10.0m) : null,
                        IgdbCriticsRatingCount = g.GameIgdbRating != null ? g.GameIgdbRating.CriticRatingCount : null,
                        CommentCount = _context.Comments.Count(c => c.CommentableType == CommentableType.Game && c.TargetEntityId == g.Id),
                        LikeCount = _context.Likes.Count(l => l.LikableType == LikableType.Game && l.TargetEntityId == g.Id && l.IsLike),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        GameModes = g.GameGameModes.Select(ggm => new { ggm.GameMode.Id, ggm.GameMode.Name }).ToList(),
                        PlayerPerspectives = g.GamePlayerPerspectives.Select(gpp => new { gpp.PlayerPerspective.Id, gpp.PlayerPerspective.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { 
                    message = "Oyunlar listelendi", 
                    data = new { 
                        data = games, 
                        totalCount = totalCount 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGameById(int id)
        {
            try
            {
                // Use optimized query with split queries for better performance
                var game = await _context.Games
                    .AsSplitQuery()
                    .Include(g => g.GameSeries)
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameGameModes)
                        .ThenInclude(ggm => ggm.GameMode)
                    .Include(g => g.GamePlayerPerspectives)
                        .ThenInclude(gpp => gpp.PlayerPerspective)
                    .Include(g => g.GameKeywords)
                        .ThenInclude(gk => gk.Keyword)
                    .Include(g => g.GameCompanies)
                        .ThenInclude(gc => gc.Company)
                    .Include(g => g.GameWebsites)
                    .Include(g => g.GameBeatTime)
                    .Include(g => g.GameIgdbRating)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (game == null)
                {
                    return NotFound(new { message = "Oyun bulunamadı" });
                }

                // Separate queries for heavy collections for better performance
                var gameMedia = await _context.Set<GameMedia>()
                    .Where(gm => gm.GameId == id)
                    .ToListAsync();
                
                // Debug log
                Console.WriteLine($"DEBUG: Game ID {id} has {gameMedia.Count} media items");
                foreach (var media in gameMedia)
                {
                    Console.WriteLine($"DEBUG: Media ID {media.Id}, Type: {media.MediaType}, URL: {media.Url}, Title: {media.Title}");
                }

                var gameRatings = await _context.Set<GameRating>()
                    .Include(gr => gr.User)
                    .Where(gr => gr.GameId == id)
                    .OrderByDescending(gr => gr.CreatedDate)
                    .Take(10)
                    .ToListAsync();

                // Calculate rating stats
                var ratingStats = await _context.Set<GameRating>()
                    .Where(gr => gr.GameId == id)
                    .GroupBy(gr => gr.GameId)
                    .Select(g => new {
                        AverageRating = g.Average(x => (double)x.Rating),
                        TotalReviews = g.Count()
                    })
                    .FirstOrDefaultAsync();

                // Calculate comment and like counts
                var commentCount = await _context.Comments.CountAsync(c => c.CommentableType == CommentableType.Game && c.TargetEntityId == id);
                var likeCount = await _context.Likes.CountAsync(l => l.LikableType == LikableType.Game && l.TargetEntityId == id && l.IsLike);

                var gameDetail = new GameDetailDto
                {
                    Id = game.Id,
                    Name = game.Name,
                    Description = game.Description,
                    Summary = game.Summary,
                    Storyline = game.Storyline,
                    ReleaseDate = game.ReleaseDate,
                    CoverImageUrl = game.CoverImageUrl,
                    Developer = game.Developer,
                    Publisher = game.Publisher,
                    IsEarlyAccess = game.IsEarlyAccess,
                    IGDBId = game.IGDBId,
                    IGDBSlug = game.IGDBSlug,
                    IGDBUrl = game.IGDBUrl,
                    GameSeries = game.GameSeries != null ? new GameDetailSeriesDto
                    {
                        Id = game.GameSeries.Id,
                        Name = game.GameSeries.Name,
                        Description = game.GameSeries.Description
                    } : null,
                    Rating = ratingStats?.AverageRating ?? 0.0,
                    TotalReviews = ratingStats?.TotalReviews ?? 0,
                    CommentCount = commentCount,
                    LikeCount = likeCount,
                    Platforms = game.GamePlatforms.Select(gp => new GameDetailPlatformDto 
                    { 
                        Id = gp.Platform.Id, 
                        Name = gp.Platform.Name 
                    }).ToList(),
                    Genres = game.GameGenres.Select(gg => new GameDetailGenreDto 
                    { 
                        Id = gg.Genre.Id, 
                        Name = gg.Genre.Name 
                    }).ToList(),
                    Themes = game.GameThemes.Select(gt => new GameDetailThemeDto 
                    { 
                        Id = gt.Theme.Id, 
                        Name = gt.Theme.Name 
                    }).ToList(),
                    GameModes = game.GameGameModes.Select(ggm => new GameDetailModeDto 
                    { 
                        Id = ggm.GameMode.Id, 
                        Name = ggm.GameMode.Name 
                    }).ToList(),
                    PlayerPerspectives = game.GamePlayerPerspectives.Select(gpp => new GameDetailPlayerPerspectiveDto 
                    { 
                        Id = gpp.PlayerPerspective.Id, 
                        Name = gpp.PlayerPerspective.Name 
                    }).ToList(),
                    Keywords = game.GameKeywords.Select(gk => new GameDetailKeywordDto 
                    { 
                        Id = gk.Keyword.Id, 
                        Name = gk.Keyword.Name 
                    }).ToList(),
                    Companies = game.GameCompanies.Select(gc => new GameDetailCompanyDto 
                    { 
                        Id = gc.Company.Id, 
                        Name = gc.Company.Name, 
                        Role = gc.IsDeveloper ? "Developer" : gc.IsPublisher ? "Publisher" : "Unknown"
                    }).ToList(),
                    Websites = game.GameWebsites.Select(gw => new GameDetailWebsiteDto 
                    { 
                        Id = gw.Id, 
                        Url = gw.Url, 
                        Category = gw.WebsiteType.ToString(),
                        Name = gw.Name 
                    }).ToList(),
                    Screenshots = gameMedia.Where(gm => gm.MediaType == MediaType.Screenshot).Select(gm => gm.Url).ToList(),
                    Videos = gameMedia.Where(gm => gm.MediaType == MediaType.Video).Select(gm => gm.Url).ToList(),
                    GameMedia = gameMedia.Select(gm => new GameDetailMediaDto
                    {
                        Id = gm.Id,
                        MediaType = (int)gm.MediaType,
                        Url = gm.Url,
                        ThumbnailUrl = gm.ThumbnailUrl,
                        Title = gm.Title,
                        Description = gm.Description,
                        Width = gm.Width,
                        Height = gm.Height,
                        IsPrimary = gm.IsPrimary
                    }).ToList(),
                    BeatTimes = game.GameBeatTime != null ? new GameDetailBeatTimeDto
                    {
                        MainStory = game.GameBeatTime.MainAvgSeconds.HasValue ? (int?)(game.GameBeatTime.MainAvgSeconds / 3600) : null,
                        MainPlusExtras = game.GameBeatTime.ExtraAvgSeconds.HasValue ? (int?)(game.GameBeatTime.ExtraAvgSeconds / 3600) : null,
                        Completionist = game.GameBeatTime.CompletionistAvgSeconds.HasValue ? (int?)(game.GameBeatTime.CompletionistAvgSeconds / 3600) : null,
                        AllStyles = game.GameBeatTime.AllAvgSeconds.HasValue ? (int?)(game.GameBeatTime.AllAvgSeconds / 3600) : null
                    } : null,
                    Reviews = gameRatings.Select(gr => new GameDetailReviewDto
                    {
                        Id = gr.Id,
                        Rating = gr.Rating,
                        Review = gr.Review,
                        CreatedDate = gr.CreatedDate,
                        User = new GameDetailUserDto
                        {
                            Id = gr.User.Id,
                            Username = gr.User.Username
                        }
                    }).ToList(),
                    IgdbRating = game.GameIgdbRating != null ? new GameDetailIgdbRatingDto
                    {
                        UserRating = (double?)game.GameIgdbRating.UserRatingDisplay,
                        UserRatingCount = game.GameIgdbRating.UserRatingCount,
                        CriticRating = (double?)game.GameIgdbRating.CriticRatingDisplay,
                        CriticRatingCount = game.GameIgdbRating.CriticRatingCount
                    } : null
                };

                return Ok(new { message = "Oyun detayları", data = gameDetail });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetGameBySlug(string slug)
        {
            try
            {
                // Use optimized query with split queries for better performance
                var game = await _context.Games
                    .AsSplitQuery()
                    .Include(g => g.GameSeries)
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameGameModes)
                        .ThenInclude(ggm => ggm.GameMode)
                    .Include(g => g.GamePlayerPerspectives)
                        .ThenInclude(gpp => gpp.PlayerPerspective)
                    .Include(g => g.GameKeywords)
                        .ThenInclude(gk => gk.Keyword)
                    .Include(g => g.GameCompanies)
                        .ThenInclude(gc => gc.Company)
                    .Include(g => g.GameWebsites)
                    .Include(g => g.GameBeatTime)
                    .Include(g => g.GameIgdbRating)
                    .FirstOrDefaultAsync(g => g.Slug == slug);

                if (game == null)
                {
                    return NotFound(new { message = "Oyun bulunamadı" });
                }

                // Separate queries for heavy collections for better performance
                var gameMedia = await _context.Set<GameMedia>()
                    .Where(gm => gm.GameId == game.Id)
                    .ToListAsync();

                var gameRatings = await _context.Set<GameRating>()
                    .Include(gr => gr.User)
                    .Where(gr => gr.GameId == game.Id)
                    .OrderByDescending(gr => gr.CreatedDate)
                    .ToListAsync();

                // Calculate rating statistics
                var ratingStats = gameRatings.Any() ? new
                {
                    AverageRating = gameRatings.Average(r => r.Rating),
                    TotalRatings = gameRatings.Count(),
                    RatingDistribution = gameRatings.GroupBy(r => r.Rating)
                        .OrderBy(g => g.Key)
                        .ToDictionary(g => g.Key, g => g.Count())
                } : new
                {
                    AverageRating = 0.0,
                    TotalRatings = 0,
                    RatingDistribution = new Dictionary<int, int>()
                };

                // Calculate comment and like counts
                var commentCount = await _context.Comments.CountAsync(c => c.CommentableType == CommentableType.Game && c.TargetEntityId == game.Id);
                var likeCount = await _context.Likes.CountAsync(l => l.LikableType == LikableType.Game && l.TargetEntityId == game.Id && l.IsLike);

                var gameDetail = new
                {
                    Id = game.Id,
                    Name = game.Name,
                    Slug = game.Slug,
                    Summary = game.Summary,
                    Description = game.Description,
                    Storyline = game.Storyline,
                    ReleaseDate = game.ReleaseDate,
                    IsEarlyAccess = game.IsEarlyAccess,
                    CoverImageUrl = game.CoverImageUrl,
                    Developer = game.Developer,
                    Publisher = game.Publisher,
                    IGDBId = game.IGDBId,
                    IGDBSlug = game.IGDBSlug,
                    IGDBUrl = game.IGDBUrl,
                    CreatedDate = game.CreatedDate,
                    UpdatedDate = game.UpdatedDate,

                    // Related Data
                    GameSeries = game.GameSeries,
                    Genres = game.GameGenres?.Select(gg => gg.Genre),
                    Platforms = game.GamePlatforms?.Select(gp => gp.Platform),
                    Themes = game.GameThemes?.Select(gt => gt.Theme),
                    GameModes = game.GameGameModes?.Select(ggm => ggm.GameMode),
                    PlayerPerspectives = game.GamePlayerPerspectives?.Select(gpp => gpp.PlayerPerspective),
                    Keywords = game.GameKeywords?.Select(gk => gk.Keyword),
                    Companies = game.GameCompanies?.Select(gc => new
                    {
                        gc.Company,
                        gc.IsDeveloper,
                        gc.IsPublisher
                    }),
                    Websites = game.GameWebsites,
                    BeatTime = game.GameBeatTime,
                    IgdbRating = game.GameIgdbRating,

                    // Media and Ratings from separate queries
                    Screenshots = gameMedia.Where(gm => gm.MediaType == MediaType.Screenshot).Select(gm => gm.Url).ToList(),
                    Videos = gameMedia.Where(gm => gm.MediaType == MediaType.Video).Select(gm => gm.Url).ToList(),
                    GameMedia = gameMedia.Select(gm => new
                    {
                        Id = gm.Id,
                        MediaType = (int)gm.MediaType,
                        Url = gm.Url,
                        ThumbnailUrl = gm.ThumbnailUrl,
                        Title = gm.Title,
                        Description = gm.Description,
                        Width = gm.Width,
                        Height = gm.Height,
                        IsPrimary = gm.IsPrimary
                    }).ToList(),
                    Media = gameMedia,
                    Ratings = gameRatings.Take(10), // Limit to recent 10 ratings for performance
                    Reviews = gameRatings.Select(gr => new GameDetailReviewDto
                    {
                        Id = gr.Id,
                        Rating = gr.Rating,
                        Review = gr.Review,
                        CreatedDate = gr.CreatedDate,
                        User = new GameDetailUserDto
                        {
                            Id = gr.User.Id,
                            Username = gr.User.Username
                        }
                    }).ToList(),
                    TotalReviews = ratingStats.TotalRatings,
                    AverageRating = ratingStats.AverageRating,
                    RatingDistribution = ratingStats.RatingDistribution,
                    RatingStats = ratingStats,
                    CommentCount = commentCount,
                    LikeCount = likeCount
                };

                return Ok(new { message = "Oyun detayları", data = gameDetail });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("test-media/{id}")]
        public async Task<IActionResult> TestGameMedia(int id)
        {
            try
            {
                var gameMedia = await _context.Set<GameMedia>()
                    .Where(gm => gm.GameId == id)
                    .Select(gm => new {
                        gm.Id,
                        gm.GameId,
                        gm.MediaType,
                        gm.Url,
                        gm.Title,
                        gm.IsPrimary
                    })
                    .ToListAsync();

                return Ok(new { 
                    message = $"GameMedia for game {id}", 
                    count = gameMedia.Count, 
                    data = gameMedia 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchGames([FromQuery] string searchTerm, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(new { message = "Arama terimi gereklidir" });
                }

                var query = _context.Games
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameRatings)
                    .Where(g => g.Name.Contains(searchTerm) || (g.Description != null && g.Description.Contains(searchTerm)));

                var totalCount = await query.CountAsync();
                var games = await query
                    .OrderByDescending(g => g.GameRatings.Count())
                    .ThenByDescending(g => g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Slug,
                        g.Description,
                        g.Summary,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Platforms = g.GamePlatforms.Select(gp => gp.Platform.Name).ToList(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { 
                    message = "Arama sonuçları", 
                    data = new { 
                        data = games, 
                        totalCount = totalCount 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("filter")]
        public async Task<IActionResult> FilterGames(
            [FromQuery] List<DomainLayer.Enums.Platform>? platforms,
            [FromQuery] List<int>? categoryIds,
            [FromQuery] List<int>? tagIds,
            [FromQuery] int? minRating,
            [FromQuery] int? maxRating)
        {
            try
            {
                var games = await _gameService.FilterGamesAsync(platforms, categoryIds, tagIds, minRating, maxRating);
                return Ok(new { message = "Filtrelenmiş oyunlar", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularGames([FromQuery] int count = 10)
        {
            try
            {
                var games = await _gameService.GetPopularGamesAsync(count);
                return Ok(new { message = "Popüler oyunlar", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentGames([FromQuery] int count = 10)
        {
            try
            {
                var games = await _gameService.GetRecentGamesAsync(count);
                return Ok(new { message = "Yeni oyunlar", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/similar")]
        public async Task<IActionResult> GetSimilarGames(int id, [FromQuery] int count = 10)
        {
            try
            {
                // Fast approach: Get only genre and theme info for the source game
                var sourceGame = await _context.Games
                    .Include(g => g.GameGenres)
                    .Include(g => g.GameThemes)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (sourceGame == null)
                {
                    return NotFound(new { message = "Oyun bulunamadı" });
                }

                var genreIds = sourceGame.GameGenres.Select(gg => gg.GenreId).ToList();
                var themeIds = sourceGame.GameThemes.Select(gt => gt.ThemeId).ToList();

                // Priority-based similarity: Focus on genre matches first, then theme
                var similarGames = await _context.Games
                    .Where(g => g.Id != id)
                    .Where(g => g.GameGenres.Any(gg => genreIds.Contains(gg.GenreId))) // Must have at least one genre match
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameRatings)
                    .Take(count * 3) // Get more candidates for better selection
                    .ToListAsync();

                // Fast similarity calculation based on genre and theme only
                var result = similarGames
                    .Select(g => new
                    {
                        Game = g,
                        GenreMatches = g.GameGenres.Count(gg => genreIds.Contains(gg.GenreId)),
                        ThemeMatches = g.GameThemes.Count(gt => themeIds.Contains(gt.ThemeId)),
                        // Simple score: Genre matches * 40 + Theme matches * 20
                        SimilarityScore = g.GameGenres.Count(gg => genreIds.Contains(gg.GenreId)) * 40 + 
                                        g.GameThemes.Count(gt => themeIds.Contains(gt.ThemeId)) * 20 +
                                        (g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0) * 2 // Bonus for good games
                    })
                    .Where(x => x.SimilarityScore > 10) // Must have some similarity
                    .OrderByDescending(x => x.SimilarityScore)
                    .ThenByDescending(x => x.Game.GameRatings.Count()) // Popular games first
                    .Take(count)
                    .Select(x => new
                    {
                        x.Game.Id,
                        x.Game.Name,
                        x.Game.Slug,
                        x.Game.Description,
                        x.Game.ReleaseDate,
                        x.Game.CoverImageUrl,
                        Rating = x.Game.GameRatings.Any() ? x.Game.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = x.Game.GameRatings.Count(),
                        Genres = x.Game.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = x.Game.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = x.Game.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList(),
                        SimilarityScore = x.SimilarityScore,
                        Debug = new {
                            GenreMatches = x.GenreMatches,
                            ThemeMatches = x.ThemeMatches,
                            GenreScore = (double)x.GenreMatches / Math.Max(genreIds.Count, x.Game.GameGenres.Count),
                            ThemeScore = (double)x.ThemeMatches / Math.Max(themeIds.Count, x.Game.GameThemes.Count)
                        }
                    })
                    .ToList();

                return Ok(new { message = "Benzer oyunlar", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("series/{seriesId}")]
        public async Task<IActionResult> GetGamesBySeries(int seriesId)
        {
            try
            {
                var games = await _context.Games
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameRatings)
                    .Where(g => g.GameSeriesId == seriesId)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Slug,
                        g.Description,
                        g.Summary,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        AverageRating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        RatingCount = g.GameRatings.Count(),
                        Platforms = g.GamePlatforms.Select(gp => gp.Platform.Name).ToList(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList()
                    })
                    .OrderBy(g => g.ReleaseDate)
                    .ToListAsync();

                // Also get the series info
                var series = await _context.GameSeries
                    .FirstOrDefaultAsync(gs => gs.Id == seriesId);

                if (series == null)
                {
                    return NotFound(new { message = "Oyun serisi bulunamadı" });
                }

                return Ok(new { 
                    message = "Seriyi oyunları", 
                    data = new { 
                        series = new { series.Id, series.Name, series.Description },
                        games = games 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        // [Authorize(Roles = "Admin,Moderator")] // Temporarily disabled for testing
        public async Task<IActionResult> CreateGame([FromBody] CreateGameDto createGameDto)
        {
            try
            {
                var game = await _gameService.CreateGameAsync(createGameDto);
                return CreatedAtAction(nameof(GetGameById), new { id = game.Id }, 
                    new { message = "Oyun oluşturuldu", data = game });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UpdateGame(int id, [FromBody] UpdateGameDto updateGameDto)
        {
            try
            {
                var game = await _gameService.UpdateGameAsync(id, updateGameDto);
                return Ok(new { message = "Oyun güncellendi", data = game });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteGame(int id)
        {
            try
            {
                var result = await _gameService.DeleteGameAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Oyun bulunamadı" });
                }

                return Ok(new { message = "Oyun silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/rate")]
        [Authorize]
        public async Task<IActionResult> RateGame(int id, [FromBody] RateGameDto rateGameDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                var result = await _gameService.RateGameAsync(id, userId, rateGameDto.Rating, rateGameDto.Review);
                if (!result)
                {
                    return BadRequest(new { message = "Oyun puanlanamadı" });
                }

                return Ok(new { message = "Oyun puanlandı" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/rating")]
        public async Task<IActionResult> GetGameRating(int id)
        {
            try
            {
                var rating = await _gameService.GetGameAverageRatingAsync(id);
                return Ok(new { message = "Oyun puanı", data = new { averageRating = rating } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("add-from-igdb")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> AddGameFromIgdb([FromBody] AddGameFromIgdbDto request)
        {
            try
            {
                if (request.IgdbId <= 0)
                {
                    return BadRequest(new { message = "Geçerli bir IGDB ID gereklidir" });
                }

                var game = await _gameDataSyncService.AddGameFromExternalAsync(request.IgdbId);
                return CreatedAtAction(nameof(GetGameById), new { id = game.Id }, 
                    new { message = "Oyun IGDB'den başarıyla eklendi", data = game });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("search-igdb")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> SearchGamesInIgdb([FromBody] SearchIgdbDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.SearchTerm))
                {
                    return BadRequest(new { message = "Arama terimi gereklidir" });
                }

                var games = await _gameDataSyncService.SearchGamesForAdminAsync(request.SearchTerm, request.Limit);
                return Ok(new { message = "IGDB arama sonuçları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/sync-igdb")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> SyncGameWithIgdb(int id)
        {
            try
            {
                await _gameDataSyncService.SyncGameWithIgdbAsync(id);
                return Ok(new { message = "Oyun IGDB ile senkronize edildi" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("themes/{id}")]
        public async Task<IActionResult> GetGamesByTheme(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GameThemes.Any(gt => gt.ThemeId == id))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Theme oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("game-modes/{id}")]
        public async Task<IActionResult> GetGamesByGameMode(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GameGameModes.Any(ggm => ggm.GameModeId == id))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Game mode oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("player-perspectives/{id}")]
        public async Task<IActionResult> GetGamesByPlayerPerspective(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GamePlayerPerspectives.Any(gpp => gpp.PlayerPerspectiveId == id))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Player perspective oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("keywords/{id}")]
        public async Task<IActionResult> GetGamesByKeyword(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GameKeywords.Any(gk => gk.KeywordId == id))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Keyword oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("platforms/{id}")]
        public async Task<IActionResult> GetGamesByPlatform(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GamePlatforms.Any(gp => gp.PlatformId == id))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Platform oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("companies/{id}/developed")]
        public async Task<IActionResult> GetGamesByDeveloper(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GameCompanies.Any(gc => gc.CompanyId == id && gc.IsDeveloper))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Developer oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("companies/{id}/published")]
        public async Task<IActionResult> GetGamesByPublisher(int id)
        {
            try
            {
                var games = await _context.Games
                    .Where(g => g.GameCompanies.Any(gc => gc.CompanyId == id && gc.IsPublisher))
                    .Include(g => g.GameGenres)
                        .ThenInclude(gg => gg.Genre)
                    .Include(g => g.GamePlatforms)
                        .ThenInclude(gp => gp.Platform)
                    .Include(g => g.GameThemes)
                        .ThenInclude(gt => gt.Theme)
                    .Include(g => g.GameRatings)
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Description,
                        g.ReleaseDate,
                        g.CoverImageUrl,
                        Rating = g.GameRatings.Any() ? g.GameRatings.Average(r => (double)r.Rating) : 0.0,
                        TotalReviews = g.GameRatings.Count(),
                        Genres = g.GameGenres.Select(gg => new { gg.Genre.Id, gg.Genre.Name }).ToList(),
                        Themes = g.GameThemes.Select(gt => new { gt.Theme.Id, gt.Theme.Name }).ToList(),
                        Platforms = g.GamePlatforms.Select(gp => new { gp.Platform.Id, gp.Platform.Name }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { message = "Publisher oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        [HttpPost("seed")]
        // [Authorize(Roles = "Admin")] // Temporarily disabled for testing
        public async Task<IActionResult> SeedGames()
        {
            try
            {
                var sampleGames = new[]
                {
                    new CreateGameDto
                    {
                        Name = "The Witcher 3: Wild Hunt",
                        Description = "Açık dünya RPG oyunu",
                        ReleaseDate = new DateTime(2015, 5, 19),
                        Publisher = "CD Projekt",
                        Developer = "CD Projekt RED",
                        MetacriticScore = 93,
                        Platforms = new List<DomainLayer.Enums.Platform> { DomainLayer.Enums.Platform.PC, DomainLayer.Enums.Platform.PlayStation, DomainLayer.Enums.Platform.Xbox },
                        GenreIds = new List<int> { 3 }, // RPG
                        TagIds = new List<int> { 1, 5, 6 } // Tek Oyunculu, Açık Dünya, Hikaye
                    },
                    new CreateGameDto
                    {
                        Name = "Cyberpunk 2077",
                        Description = "Futuristik RPG oyunu",
                        ReleaseDate = new DateTime(2020, 12, 10),
                        Publisher = "CD Projekt",
                        Developer = "CD Projekt RED",
                        MetacriticScore = 86,
                        Platforms = new List<DomainLayer.Enums.Platform> { DomainLayer.Enums.Platform.PC, DomainLayer.Enums.Platform.PlayStation, DomainLayer.Enums.Platform.Xbox },
                        GenreIds = new List<int> { 3 }, // RPG
                        TagIds = new List<int> { 1, 5, 6 } // Tek Oyunculu, Açık Dünya, Hikaye
                    },
                    new CreateGameDto
                    {
                        Name = "Counter-Strike 2",
                        Description = "Takım tabanlı FPS oyunu",
                        ReleaseDate = new DateTime(2023, 9, 27),
                        Publisher = "Valve",
                        Developer = "Valve",
                        MetacriticScore = 85,
                        Platforms = new List<DomainLayer.Enums.Platform> { DomainLayer.Enums.Platform.PC },
                        GenreIds = new List<int> { 1 }, // Aksiyon
                        TagIds = new List<int> { 2, 3, 10 } // Çok Oyunculu, Online, Ücretsiz
                    },
                    new CreateGameDto
                    {
                        Name = "Elden Ring",
                        Description = "Souls-like RPG oyunu",
                        ReleaseDate = new DateTime(2022, 2, 25),
                        Publisher = "Bandai Namco",
                        Developer = "FromSoftware",
                        MetacriticScore = 96,
                        Platforms = new List<DomainLayer.Enums.Platform> { DomainLayer.Enums.Platform.PC, DomainLayer.Enums.Platform.PlayStation, DomainLayer.Enums.Platform.Xbox },
                        GenreIds = new List<int> { 3 }, // RPG
                        TagIds = new List<int> { 1, 5, 15 } // Tek Oyunculu, Açık Dünya, Zorlu
                    },
                    new CreateGameDto
                    {
                        Name = "Minecraft",
                        Description = "Sandbox survival oyunu",
                        ReleaseDate = new DateTime(2011, 11, 18),
                        Publisher = "Mojang Studios",
                        Developer = "Mojang Studios",
                        MetacriticScore = 93,
                        Platforms = new List<DomainLayer.Enums.Platform> { DomainLayer.Enums.Platform.PC, DomainLayer.Enums.Platform.PlayStation, DomainLayer.Enums.Platform.Xbox, DomainLayer.Enums.Platform.Nintendo, DomainLayer.Enums.Platform.Mobile },
                        GenreIds = new List<int> { 8 }, // Simülasyon
                        TagIds = new List<int> { 1, 2, 5 } // Tek Oyunculu, Çok Oyunculu, Açık Dünya
                    }
                };

                foreach (var gameDto in sampleGames)
                {
                    try
                    {
                        await _gameService.CreateGameAsync(gameDto);
                    }
                    catch (Exception)
                    {
                        // Continue with other games if one fails
                        continue;
                    }
                }

                return Ok(new { message = "Örnek oyunlar oluşturuldu" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


    }

    public class RateGameDto
    {
        public int Rating { get; set; }
        public string? Review { get; set; }
    }

    public class AddGameFromIgdbDto
    {
        public int IgdbId { get; set; }
    }

    public class SearchIgdbDto
    {
        public string SearchTerm { get; set; } = string.Empty;
        public int Limit { get; set; } = 10;
    }

}