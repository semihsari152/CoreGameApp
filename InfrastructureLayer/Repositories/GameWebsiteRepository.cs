using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameWebsiteRepository : Repository<GameWebsite>, IGameWebsiteRepository
    {
        public GameWebsiteRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GameWebsite>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameWebsites.Where(gw => gw.GameId == gameId).ToListAsync();
        }

        public async Task<IEnumerable<GameWebsite>> GetByGameIdAndTypeAsync(int gameId, DomainLayer.Enums.WebsiteType websiteType)
        {
            return await _context.GameWebsites.Where(gw => gw.GameId == gameId && gw.WebsiteType == websiteType).ToListAsync();
        }
    }
}