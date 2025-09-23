using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class GameRatingRepository : Repository<GameRating>, IGameRatingRepository
    {
        private readonly AppDbContext _context;

        public GameRatingRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GameRating>> GetRatingsByGameAsync(int gameId)
        {
            return await _context.GameRatings
                .Include(gr => gr.User)
                .Where(gr => gr.GameId == gameId)
                .OrderByDescending(gr => gr.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<GameRating>> GetRatingsByUserAsync(int userId)
        {
            return await _context.GameRatings
                .Include(gr => gr.Game)
                .Where(gr => gr.UserId == userId)
                .OrderByDescending(gr => gr.CreatedDate)
                .ToListAsync();
        }

        public async Task<GameRating?> GetUserRatingAsync(int userId, int gameId)
        {
            return await _context.GameRatings
                .FirstOrDefaultAsync(gr => gr.UserId == userId && gr.GameId == gameId);
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

        public async Task<IEnumerable<GameRating>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameRatings
                .Where(gr => gr.GameId == gameId)
                .ToListAsync();
        }
    }
}