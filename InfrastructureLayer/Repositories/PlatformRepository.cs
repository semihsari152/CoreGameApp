using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class PlatformRepository : Repository<Platform>, IPlatformRepository
    {
        public PlatformRepository(AppDbContext context) : base(context) { }

        public async Task<Platform?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.Platforms.FirstOrDefaultAsync(p => p.IGDBId == igdbId);
        }

        public async Task<Platform?> GetByNameAsync(string name)
        {
            return await _context.Platforms.FirstOrDefaultAsync(p => p.Name == name);
        }

        public async Task<IEnumerable<Platform>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds)
        {
            return await _context.Platforms.Where(p => igdbIds.Contains(p.IGDBId.Value)).ToListAsync();
        }

        public async Task<Platform> GetOrCreateByIgdbIdAsync(int igdbId, string name)
        {
            var existing = await GetByIgdbIdAsync(igdbId);
            if (existing != null)
                return existing;

            var newPlatform = new Platform
            {
                IGDBId = igdbId,
                Name = name,
                CreatedDate = DateTime.UtcNow
            };

            await AddAsync(newPlatform);
            await _context.SaveChangesAsync(); // Save immediately to get ID
            return newPlatform;
        }
    }
}