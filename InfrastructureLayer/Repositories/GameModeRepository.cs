using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameModeRepository : Repository<GameMode>, IGameModeRepository
    {
        public GameModeRepository(AppDbContext context) : base(context) { }

        public async Task<GameMode?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.GameModes.FirstOrDefaultAsync(gm => gm.IGDBId == igdbId);
        }

        public async Task<GameMode?> GetByNameAsync(string name)
        {
            return await _context.GameModes.FirstOrDefaultAsync(gm => gm.Name == name);
        }

        public async Task<IEnumerable<GameMode>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds)
        {
            return await _context.GameModes.Where(gm => igdbIds.Contains(gm.IGDBId.Value)).ToListAsync();
        }

        public async Task<GameMode> GetOrCreateByIgdbIdAsync(int igdbId, string name)
        {
            var existing = await GetByIgdbIdAsync(igdbId);
            if (existing != null)
                return existing;

            var newGameMode = new GameMode
            {
                IGDBId = igdbId,
                Name = name,
                CreatedDate = DateTime.UtcNow
            };

            await AddAsync(newGameMode);
            await _context.SaveChangesAsync(); // Save immediately to get ID
            return newGameMode;
        }
    }
}