using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameGameModeRepository : Repository<GameGameMode>, IGameGameModeRepository
    {
        public GameGameModeRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GameGameMode>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameGameModes.Where(ggm => ggm.GameId == gameId).ToListAsync();
        }

        public async Task<IEnumerable<GameGameMode>> GetByGameModeIdAsync(int gameModeId)
        {
            return await _context.GameGameModes.Where(ggm => ggm.GameModeId == gameModeId).ToListAsync();
        }
    }
}