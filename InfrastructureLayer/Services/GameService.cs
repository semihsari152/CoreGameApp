using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class GameService : IGameService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public GameService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<GameDto?> GetGameByIdAsync(int id)
        {
            var game = await _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .Include(g => g.GameKeywords)
                    .ThenInclude(gk => gk.Keyword)
                .FirstOrDefaultAsync(g => g.Id == id);

            return game == null ? null : _mapper.Map<GameDto>(game);
        }

        public async Task<IEnumerable<GameDto>> GetAllGamesAsync()
        {
            var games = await _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .Include(g => g.GameKeywords)
                    .ThenInclude(gk => gk.Keyword)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<IEnumerable<GameDto>> SearchGamesAsync(string searchTerm)
        {
            var games = await _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .Where(g => g.Name.Contains(searchTerm) || 
                           (g.Description != null && g.Description.Contains(searchTerm)) ||
                           (g.Developer != null && g.Developer.Contains(searchTerm)) ||
                           (g.Publisher != null && g.Publisher.Contains(searchTerm)))
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<IEnumerable<GameDto>> FilterGamesAsync(List<DomainLayer.Enums.Platform>? platforms, List<int>? categoryIds, List<int>? tagIds, int? minRating, int? maxRating)
        {
            var query = _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .AsQueryable();

            if (platforms != null && platforms.Any())
            {
                var platformNames = platforms.Select(p => p.ToString()).ToList();
                query = query.Where(g => g.GamePlatforms.Any(gp => platformNames.Contains(gp.Platform.Name)));
            }

            if (categoryIds != null && categoryIds.Any())
            {
                query = query.Where(g => g.GameGenres.Any(gg => categoryIds.Contains(gg.GenreId)));
            }

            // tagIds parametresi kaldırıldı çünkü GameTags artık yok

            if (minRating.HasValue)
            {
                query = query.Where(g => g.GameIgdbRating != null && g.GameIgdbRating.UserRating.HasValue && g.GameIgdbRating.UserRating >= minRating.Value * 10);
            }

            if (maxRating.HasValue)
            {
                query = query.Where(g => g.GameIgdbRating != null && g.GameIgdbRating.UserRating.HasValue && g.GameIgdbRating.UserRating <= maxRating.Value * 10);
            }

            var games = await query.ToListAsync();
            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<GameDto> CreateGameAsync(CreateGameDto createGameDto)
        {
            var game = _mapper.Map<Game>(createGameDto);
            game.CreatedDate = DateTime.UtcNow;
            game.UpdatedDate = DateTime.UtcNow;

            await _unitOfWork.Games.AddAsync(game);
            await _unitOfWork.SaveChangesAsync();

            // Add platforms
            if (createGameDto.Platforms.Any())
            {
                foreach (var platformEnum in createGameDto.Platforms)
                {
                    var platform = await _unitOfWork.Platforms.GetByNameAsync(platformEnum.ToString());
                    if (platform == null)
                    {
                        platform = new DomainLayer.Entities.Platform
                        {
                            Name = platformEnum.ToString(),
                            CreatedDate = DateTime.UtcNow
                        };
                        await _unitOfWork.Platforms.AddAsync(platform);
                        await _unitOfWork.SaveChangesAsync();
                    }

                    var gamePlatform = new GamePlatform
                    {
                        GameId = game.Id,
                        PlatformId = platform.Id,
                        CreatedDate = DateTime.UtcNow
                    };

                    await _context.GamePlatforms.AddAsync(gamePlatform);
                }
            }

            // Add genres
            if (createGameDto.GenreIds.Any())
            {
                var gameGenres = createGameDto.GenreIds.Select(gId => new GameGenre
                {
                    GameId = game.Id,
                    GenreId = gId,
                    CreatedDate = DateTime.UtcNow
                });

                await _context.GameGenres.AddRangeAsync(gameGenres);
            }

            // Tags artık kullanılmıyor, kaldırıldı

            await _unitOfWork.SaveChangesAsync();

            var createdGame = await GetGameByIdAsync(game.Id);
            return createdGame ?? throw new InvalidOperationException("Oyun oluşturulamadı.");
        }

        public async Task<GameDto> UpdateGameAsync(int id, UpdateGameDto updateGameDto)
        {
            var game = await _unitOfWork.Games.GetByIdAsync(id);
            if (game == null)
                throw new InvalidOperationException("Oyun bulunamadı.");

            _mapper.Map(updateGameDto, game);
            
            // Always set GameSeriesId explicitly (important for null values)
            game.GameSeriesId = updateGameDto.GameSeriesId;
            
            game.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.Games.Update(game);

            // Update platforms if provided
            if (updateGameDto.Platforms != null)
            {
                var existingPlatforms = await _context.GamePlatforms
                    .Where(gp => gp.GameId == id)
                    .ToListAsync();

                _context.GamePlatforms.RemoveRange(existingPlatforms);

                if (updateGameDto.Platforms.Any())
                {
                    var newPlatforms = new List<GamePlatform>();
                    foreach (var platformEnum in updateGameDto.Platforms)
                    {
                        var platform = await _unitOfWork.Platforms.GetByNameAsync(platformEnum.ToString());
                        if (platform == null)
                        {
                            platform = new DomainLayer.Entities.Platform
                            {
                                Name = platformEnum.ToString(),
                                CreatedDate = DateTime.UtcNow
                            };
                            await _unitOfWork.Platforms.AddAsync(platform);
                            await _unitOfWork.SaveChangesAsync();
                        }

                        newPlatforms.Add(new GamePlatform
                        {
                            GameId = id,
                            PlatformId = platform.Id,
                            CreatedDate = DateTime.UtcNow
                        });
                    }

                    await _context.GamePlatforms.AddRangeAsync(newPlatforms);
                }
            }

            // Update genres if provided
            if (updateGameDto.GenreIds != null)
            {
                var existingGenres = await _context.GameGenres
                    .Where(gg => gg.GameId == id)
                    .ToListAsync();

                _context.GameGenres.RemoveRange(existingGenres);

                if (updateGameDto.GenreIds.Any())
                {
                    var newGenres = updateGameDto.GenreIds.Select(gId => new GameGenre
                    {
                        GameId = id,
                        GenreId = gId,
                        CreatedDate = DateTime.UtcNow
                    });

                    await _context.GameGenres.AddRangeAsync(newGenres);
                }
            }

            // Tags artık kullanılmıyor, kaldırıldı

            await _unitOfWork.SaveChangesAsync();

            return await GetGameByIdAsync(id) ?? throw new InvalidOperationException("Oyun güncellenemedi.");
        }

        public async Task<bool> DeleteGameAsync(int id)
        {
            var game = await _unitOfWork.Games.GetByIdAsync(id);
            if (game == null)
                return false;

            _unitOfWork.Games.Remove(game);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RateGameAsync(int gameId, int userId, int rating, string? review)
        {
            if (rating < 1 || rating > 10)
                throw new ArgumentException("Rating must be between 1 and 10");

            var existingRating = await _context.GameRatings
                .FirstOrDefaultAsync(gr => gr.GameId == gameId && gr.UserId == userId);

            if (existingRating != null)
            {
                existingRating.Rating = rating;
                existingRating.Review = review;
                existingRating.UpdatedDate = DateTime.UtcNow;
            }
            else
            {
                var gameRating = new GameRating
                {
                    GameId = gameId,
                    UserId = userId,
                    Rating = rating,
                    Review = review,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };

                await _context.GameRatings.AddAsync(gameRating);
            }

            await _context.SaveChangesAsync();

            // Update game average rating
            await UpdateGameAverageRatingAsync(gameId);

            return true;
        }

        public async Task<decimal> GetGameAverageRatingAsync(int gameId)
        {
            var ratings = await _context.GameRatings
                .Where(gr => gr.GameId == gameId)
                .ToListAsync();

            return ratings.Any() ? (decimal)ratings.Average(r => r.Rating) : 0;
        }

        public async Task<IEnumerable<GameDto>> GetPopularGamesAsync(int count = 10)
        {
            var games = await _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .Include(g => g.GameIgdbRating)
                .Where(g => g.GameIgdbRating != null && g.GameIgdbRating.UserRating.HasValue)
                .OrderByDescending(g => g.GameIgdbRating.UserRating)
                .ThenByDescending(g => g.GameIgdbRating.UserRatingCount)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<IEnumerable<GameDto>> GetRecentGamesAsync(int count = 10)
        {
            var games = await _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .OrderByDescending(g => g.ReleaseDate)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<IEnumerable<GameDto>> GetSimilarGamesAsync(int gameId, int count = 10)
        {
            var game = await _context.Games
                .Include(g => g.GameGenres)
                .FirstOrDefaultAsync(g => g.Id == gameId);

            if (game == null)
                return Enumerable.Empty<GameDto>();

            var genreIds = game.GameGenres.Select(gg => gg.GenreId).ToList();

            var similarGames = await _context.Games
                .Include(g => g.GamePlatforms)
                    .ThenInclude(gp => gp.Platform)
                .Include(g => g.GameGenres)
                    .ThenInclude(gg => gg.Genre)
                .Where(g => g.Id != gameId &&
                           g.GameGenres.Any(gg => genreIds.Contains(gg.GenreId)))
                .OrderByDescending(g => g.GameIgdbRating != null && g.GameIgdbRating.UserRating.HasValue ? g.GameIgdbRating.UserRating : 0)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameDto>>(similarGames);
        }

        private async Task UpdateGameAverageRatingAsync(int gameId)
        {
            var game = await _context.Games
                .FirstOrDefaultAsync(g => g.Id == gameId);
            
            if (game == null) return;

            var ratings = await _context.GameRatings
                .Where(gr => gr.GameId == gameId)
                .ToListAsync();

            // User ratings are now stored separately in GameRating table
            // No need to update Game entity directly as user ratings are distinct from IGDB ratings

            game.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<GameDto>> GetTopRatedGamesAsync(int count = 20)
        {
            var games = await _unitOfWork.Games.GetTopRatedGamesAsync(count);
            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<IEnumerable<GameDto>> GetGamesByGenreAsync(int genreId)
        {
            var games = await _unitOfWork.Games.GetGamesByGenreAsync(genreId);
            return _mapper.Map<IEnumerable<GameDto>>(games);
        }

        public async Task<GameRatingDto> RateGameAsync(CreateGameRatingDto ratingDto)
        {
            var existingRating = await _context.GameRatings
                .FirstOrDefaultAsync(gr => gr.GameId == ratingDto.GameId && gr.UserId == ratingDto.UserId);

            GameRating gameRating;
            if (existingRating != null)
            {
                existingRating.Rating = ratingDto.Rating;
                existingRating.Review = ratingDto.Review;
                existingRating.UpdatedDate = DateTime.UtcNow;
                gameRating = existingRating;
            }
            else
            {
                gameRating = _mapper.Map<GameRating>(ratingDto);
                gameRating.CreatedDate = DateTime.UtcNow;
                gameRating.UpdatedDate = DateTime.UtcNow;
                await _context.GameRatings.AddAsync(gameRating);
            }

            await _context.SaveChangesAsync();

            // Update game average rating
            await UpdateGameAverageRatingAsync(ratingDto.GameId);

            return _mapper.Map<GameRatingDto>(gameRating);
        }
    }
}