using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameTagRepository : Repository<GameTag>, IGameTagRepository
    {
        public GameTagRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GameTag>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameTags.Where(gt => gt.GameId == gameId).ToListAsync();
        }

        public async Task<IEnumerable<GameTag>> GetByTagIdAsync(int tagId)
        {
            return await _context.GameTags.Where(gt => gt.TagId == tagId).ToListAsync();
        }
    }
}