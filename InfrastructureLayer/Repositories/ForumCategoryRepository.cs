using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class ForumCategoryRepository : Repository<ForumCategory>, IForumCategoryRepository
    {
        private readonly AppDbContext _context;

        public ForumCategoryRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<ForumCategory?> GetByNameAsync(string name)
        {
            return await _context.ForumCategories
                .FirstOrDefaultAsync(fc => fc.Name == name);
        }

        public async Task<IEnumerable<ForumCategory>> GetActiveForumCategoriesAsync()
        {
            return await _context.ForumCategories
                .OrderBy(fc => fc.Order)
                .ThenBy(fc => fc.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<ForumCategory>> GetForumCategoriesWithTopicsAsync()
        {
            return await _context.ForumCategories
                .Include(fc => fc.ForumTopics)
                .OrderBy(fc => fc.Order)
                .ThenBy(fc => fc.Name)
                .ToListAsync();
        }

        public async Task<bool> IsForumCategoryNameExistsAsync(string name)
        {
            return await _context.ForumCategories
                .AnyAsync(fc => fc.Name == name);
        }
    }
}