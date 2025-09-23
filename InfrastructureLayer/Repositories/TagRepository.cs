using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class TagRepository : Repository<Tag>, ITagRepository
    {
        private readonly AppDbContext _context;

        public TagRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Tag?> GetByNameAsync(string name)
        {
            return await _context.Tags
                .FirstOrDefaultAsync(t => t.Name == name);
        }

        public async Task<IEnumerable<Tag>> GetPopularTagsAsync(int count)
        {
            return await _context.Tags
                .Include(t => t.GameTags)
                .Include(t => t.ForumTopicTags)
                .Include(t => t.BlogPostTags)
                .OrderByDescending(t => t.GameTags.Count + t.ForumTopicTags.Count + t.BlogPostTags.Count)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Tag>> SearchTagsAsync(string searchTerm)
        {
            return await _context.Tags
                .Where(t => t.Name.Contains(searchTerm))
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        public async Task<bool> IsTagNameExistsAsync(string name)
        {
            return await _context.Tags
                .AnyAsync(t => t.Name == name);
        }

        public async Task<Tag?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.Tags
                .FirstOrDefaultAsync(t => t.IGDBId == igdbId);
        }

        public async Task<IEnumerable<Tag>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds)
        {
            return await _context.Tags
                .Where(t => igdbIds.Contains(t.IGDBId.Value))
                .ToListAsync();
        }
    }
}