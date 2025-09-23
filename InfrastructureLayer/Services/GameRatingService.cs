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
    public class GameRatingService : IGameRatingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public GameRatingService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<GameRatingDto?> GetGameRatingByIdAsync(int id)
        {
            var rating = await _context.GameRatings
                .Include(gr => gr.User)
                .Include(gr => gr.Game)
                .FirstOrDefaultAsync(gr => gr.Id == id);

            return rating == null ? null : _mapper.Map<GameRatingDto>(rating);
        }

        public async Task<IEnumerable<GameRatingDto>> GetRatingsByGameAsync(int gameId)
        {
            var ratings = await _context.GameRatings
                .Include(gr => gr.User)
                .Include(gr => gr.Game)
                .Where(gr => gr.GameId == gameId)
                .OrderByDescending(gr => gr.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameRatingDto>>(ratings);
        }

        public async Task<IEnumerable<GameRatingDto>> GetRatingsByUserAsync(int userId)
        {
            var ratings = await _context.GameRatings
                .Include(gr => gr.User)
                .Include(gr => gr.Game)
                .Where(gr => gr.UserId == userId)
                .OrderByDescending(gr => gr.CreatedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GameRatingDto>>(ratings);
        }

        public async Task<GameRatingDto?> GetUserRatingAsync(int userId, int gameId)
        {
            var rating = await _context.GameRatings
                .Include(gr => gr.User)
                .Include(gr => gr.Game)
                .FirstOrDefaultAsync(gr => gr.UserId == userId && gr.GameId == gameId);

            return rating == null ? null : _mapper.Map<GameRatingDto>(rating);
        }

        public async Task<double> GetAverageRatingAsync(int gameId)
        {
            var ratings = await _context.GameRatings
                .Where(gr => gr.GameId == gameId)
                .Select(gr => gr.Rating)
                .ToListAsync();

            return ratings.Any() ? ratings.Average() : 0;
        }

        public async Task<bool> HasUserRatedAsync(int userId, int gameId)
        {
            return await _context.GameRatings
                .AnyAsync(gr => gr.UserId == userId && gr.GameId == gameId);
        }

        public async Task<GameRatingDto> CreateGameRatingAsync(CreateGameRatingDto createGameRatingDto)
        {
            // Check if user has already rated this game
            var existingRating = await _context.GameRatings
                .FirstOrDefaultAsync(gr => gr.UserId == createGameRatingDto.UserId && 
                                         gr.GameId == createGameRatingDto.GameId);

            if (existingRating != null)
                throw new InvalidOperationException("Bu oyunu zaten derecelendirmişsiniz.");

            var rating = _mapper.Map<GameRating>(createGameRatingDto);
            rating.CreatedDate = DateTime.UtcNow;
            rating.UpdatedDate = DateTime.UtcNow;

            await _unitOfWork.GameRatings.AddAsync(rating);
            await _unitOfWork.SaveChangesAsync();

            // Update game's average rating
            await UpdateGameAverageRatingAsync(createGameRatingDto.GameId);

            return await GetGameRatingByIdAsync(rating.Id) ?? throw new InvalidOperationException("Oyun derecelendirmesi oluşturulamadı.");
        }

        public async Task<GameRatingDto> UpdateGameRatingAsync(int id, UpdateGameRatingDto updateGameRatingDto)
        {
            var rating = await _unitOfWork.GameRatings.GetByIdAsync(id);
            if (rating == null)
                throw new InvalidOperationException("Oyun derecelendirmesi bulunamadı.");

            _mapper.Map(updateGameRatingDto, rating);
            rating.UpdatedDate = DateTime.UtcNow;

            _unitOfWork.GameRatings.Update(rating);
            await _unitOfWork.SaveChangesAsync();

            // Update game's average rating
            await UpdateGameAverageRatingAsync(rating.GameId);

            return await GetGameRatingByIdAsync(id) ?? throw new InvalidOperationException("Oyun derecelendirmesi güncellenemedi.");
        }

        public async Task DeleteGameRatingAsync(int id)
        {
            var rating = await _unitOfWork.GameRatings.GetByIdAsync(id);
            if (rating == null)
                throw new InvalidOperationException("Oyun derecelendirmesi bulunamadı.");

            var gameId = rating.GameId;

            _unitOfWork.GameRatings.Remove(rating);
            await _unitOfWork.SaveChangesAsync();

            // Update game's average rating
            await UpdateGameAverageRatingAsync(gameId);
        }

        public async Task<GameRatingStatsDto> GetRatingStatsAsync(int gameId)
        {
            var ratings = await _context.GameRatings
                .Where(gr => gr.GameId == gameId)
                .Select(gr => gr.Rating)
                .ToListAsync();

            if (!ratings.Any())
            {
                return new GameRatingStatsDto
                {
                    TotalRatings = 0,
                    AverageRating = 0,
                    RatingDistribution = new Dictionary<int, int>()
                };
            }

            var distribution = new Dictionary<int, int>();
            for (int i = 1; i <= 10; i++)
            {
                distribution[i] = ratings.Count(r => r == i);
            }

            return new GameRatingStatsDto
            {
                TotalRatings = ratings.Count,
                AverageRating = ratings.Average(),
                RatingDistribution = distribution
            };
        }

        private async Task UpdateGameAverageRatingAsync(int gameId)
        {
            var game = await _context.Games
                .FirstOrDefaultAsync(g => g.Id == gameId);
            
            if (game == null) return;

            var ratings = await _context.GameRatings
                .Where(gr => gr.GameId == gameId)
                .Select(gr => gr.Rating)
                .ToListAsync();

            // User ratings are now separate from IGDB ratings
            // User ratings are stored in GameRating table, IGDB ratings in GameIgdbRating table
            // No need to update Game entity directly

            game.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}