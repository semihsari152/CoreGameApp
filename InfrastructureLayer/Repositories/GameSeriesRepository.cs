using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameSeriesRepository : Repository<GameSeries>, IGameSeriesRepository
    {
        public GameSeriesRepository(AppDbContext context) : base(context) { }

        public async Task<GameSeries?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.GameSeries.FirstOrDefaultAsync(gs => gs.IGDBId == igdbId);
        }

        public async Task<GameSeries?> GetByNameAsync(string name)
        {
            return await _context.GameSeries.FirstOrDefaultAsync(gs => gs.Name == name);
        }

        public async Task<IEnumerable<GameSeries>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds)
        {
            return await _context.GameSeries.Where(gs => igdbIds.Contains(gs.IGDBId.Value)).ToListAsync();
        }

        public async Task<IEnumerable<GameSeries>> GetAllWithGameCountAsync()
        {
            return await _context.GameSeries
                .Select(gs => new GameSeries
                {
                    Id = gs.Id,
                    Name = gs.Name,
                    Description = gs.Description,
                    IGDBId = gs.IGDBId,
                    IGDBName = gs.IGDBName,
                    CreatedDate = gs.CreatedDate,
                    Games = gs.Games.Take(0).ToList() // Empty collection for count
                })
                .ToListAsync();
        }

        public async Task<bool> ExistsByNameAsync(string name)
        {
            return await _context.GameSeries.AnyAsync(gs => gs.Name.ToLower() == name.ToLower());
        }

        public async Task<GameSeries?> GetByIdWithGamesAsync(int id)
        {
            return await _context.GameSeries
                .Include(gs => gs.Games)
                .FirstOrDefaultAsync(gs => gs.Id == id);
        }
    }
}