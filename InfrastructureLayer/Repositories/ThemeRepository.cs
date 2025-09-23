using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class ThemeRepository : Repository<Theme>, IThemeRepository
    {
        public ThemeRepository(AppDbContext context) : base(context) { }

        public async Task<Theme?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.Themes.FirstOrDefaultAsync(t => t.IGDBId == igdbId);
        }

        public async Task<Theme?> GetByNameAsync(string name)
        {
            return await _context.Themes.FirstOrDefaultAsync(t => t.Name == name);
        }

        public async Task<IEnumerable<Theme>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds)
        {
            return await _context.Themes.Where(t => igdbIds.Contains(t.IGDBId.Value)).ToListAsync();
        }

        public async Task<Theme> GetOrCreateByIgdbIdAsync(int igdbId, string name)
        {
            var existing = await GetByIgdbIdAsync(igdbId);
            if (existing != null)
                return existing;

            var newTheme = new Theme
            {
                IGDBId = igdbId,
                Name = name,
                CreatedDate = DateTime.UtcNow
            };

            await AddAsync(newTheme);
            await _context.SaveChangesAsync(); // Save immediately to get ID
            return newTheme;
        }
    }
}