using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class GameRepository : Repository<Game>, IGameRepository
    {
        private readonly AppDbContext _context;

        public GameRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Game>> GetGamesByNameAsync(string name)
        {
            return await _context.Games
                .Where(g => g.Name.Contains(name))
                .OrderBy(g => g.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Game>> GetGamesByGenreAsync(int genreId)
        {
            return await _context.Games
                .Where(g => g.GameGenres.Any(gg => gg.GenreId == genreId))
                .ToListAsync();
        }

        public async Task<IEnumerable<Game>> GetGamesByPlatformAsync(DomainLayer.Enums.Platform platform)
        {
            return await _context.Games
                .Where(g => g.GamePlatforms.Any(gp => gp.Platform.Name == platform.ToString()))
                .ToListAsync();
        }

        public async Task<IEnumerable<Game>> GetTopRatedGamesAsync(int count)
        {
            return await _context.Games
                .Include(g => g.GameIgdbRating)
                .Where(g => g.GameIgdbRating != null && g.GameIgdbRating.UserRating.HasValue && g.GameIgdbRating.UserRatingCount > 0)
                .OrderByDescending(g => g.GameIgdbRating.UserRating)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Game>> GetRecentGamesAsync(int count)
        {
            return await _context.Games
                .OrderByDescending(g => g.CreatedDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Game>> SearchGamesAsync(string searchTerm)
        {
            return await _context.Games
                .Where(g => g.Name.Contains(searchTerm) || 
                           (g.Description != null && g.Description.Contains(searchTerm)) ||
                           (g.Developer != null && g.Developer.Contains(searchTerm)) ||
                           (g.Publisher != null && g.Publisher.Contains(searchTerm)))
                .OrderBy(g => g.Name)
                .ToListAsync();
        }

        public async Task<Game?> GetByIGDBIdAsync(int igdbId)
        {
            return await _context.Games
                .FirstOrDefaultAsync(g => g.IGDBId == igdbId);
        }

        public async Task UpdateAverageRatingAsync(int gameId)
        {
            var game = await _context.Games
                .Include(g => g.GameRatings)
                .FirstOrDefaultAsync(g => g.Id == gameId);

            if (game != null)
            {
                // User ratings are now handled separately via GameRating table
                // No need to update Game entity directly
                
                game.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        // New methods for external API sync
        public async Task<Game?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.Games
                .FirstOrDefaultAsync(g => g.IGDBId == igdbId);
        }

        public async Task<Game?> GetBySlugAsync(string slug)
        {
            return await _context.Games
                .FirstOrDefaultAsync(g => g.Slug == slug);
        }

        public async Task<IEnumerable<Game>> GetGamesWithIgdbIdAsync()
        {
            return await _context.Games
                .Where(g => g.IGDBId.HasValue)
                .ToListAsync();
        }

        public async Task<IEnumerable<Game>> GetGamesNeedingSyncAsync()
        {
            return await _context.Games
                .Where(g => !g.IsDataComplete || 
                           (g.IGDBId.HasValue && (!g.IGDBLastSync.HasValue || g.IGDBLastSync < DateTime.UtcNow.AddDays(-7))))
                .ToListAsync();
        }
    }
}