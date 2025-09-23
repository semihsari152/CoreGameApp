using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GuideBlockRepository : Repository<GuideBlock>, IGuideBlockRepository
    {
        private readonly AppDbContext _context;

        public GuideBlockRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GuideBlock>> GetByGuideIdAsync(int guideId)
        {
            return await _context.GuideBlocks
                .Where(gb => gb.GuideId == guideId)
                .OrderBy(gb => gb.Order)
                .ToListAsync();
        }

        public async Task<GuideBlock?> GetByGuideIdAndOrderAsync(int guideId, int order)
        {
            return await _context.GuideBlocks
                .FirstOrDefaultAsync(gb => gb.GuideId == guideId && gb.Order == order);
        }

        public async Task ReorderBlocksAsync(int guideId, List<(int blockId, int newOrder)> reorderList)
        {
            var blocks = await _context.GuideBlocks
                .Where(gb => gb.GuideId == guideId)
                .ToListAsync();

            foreach (var (blockId, newOrder) in reorderList)
            {
                var block = blocks.FirstOrDefault(b => b.Id == blockId);
                if (block != null)
                {
                    block.Order = newOrder;
                    block.UpdatedDate = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteByGuideIdAsync(int guideId)
        {
            var blocks = await _context.GuideBlocks
                .Where(gb => gb.GuideId == guideId)
                .ToListAsync();

            _context.GuideBlocks.RemoveRange(blocks);
            await _context.SaveChangesAsync();
        }
    }
}