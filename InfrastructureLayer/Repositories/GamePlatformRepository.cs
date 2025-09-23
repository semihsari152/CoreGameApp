using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GamePlatformRepository : Repository<GamePlatform>, IGamePlatformRepository
    {
        public GamePlatformRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<GamePlatform>> GetByGameIdAsync(int gameId)
        {
            return await _dbSet
                .Where(gp => gp.GameId == gameId)
                .ToListAsync();
        }
    }
}