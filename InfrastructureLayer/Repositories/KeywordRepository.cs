using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class KeywordRepository : Repository<Keyword>, IKeywordRepository
    {
        public KeywordRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Keyword?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.Keywords.FirstOrDefaultAsync(k => k.IGDBId == igdbId);
        }

        public async Task<Keyword> GetOrCreateByIgdbIdAsync(int igdbId, string name)
        {
            var existing = await GetByIgdbIdAsync(igdbId);
            if (existing != null)
                return existing;

            var newKeyword = new Keyword
            {
                IGDBId = igdbId,
                Name = name,
                CreatedDate = DateTime.UtcNow
            };

            await AddAsync(newKeyword);
            await _context.SaveChangesAsync(); // Save immediately to get ID
            return newKeyword;
        }
    }
}