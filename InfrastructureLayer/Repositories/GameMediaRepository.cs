using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameMediaRepository : Repository<GameMedia>, IGameMediaRepository
    {
        public GameMediaRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GameMedia>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameMedia.Where(gm => gm.GameId == gameId).ToListAsync();
        }

        public async Task<IEnumerable<GameMedia>> GetByGameIdAndTypeAsync(int gameId, DomainLayer.Enums.MediaType mediaType)
        {
            return await _context.GameMedia.Where(gm => gm.GameId == gameId && gm.MediaType == mediaType).ToListAsync();
        }

        public async Task<GameMedia?> GetPrimaryByGameIdAsync(int gameId)
        {
            return await _context.GameMedia.FirstOrDefaultAsync(gm => gm.GameId == gameId && gm.IsPrimary);
        }
    }
}