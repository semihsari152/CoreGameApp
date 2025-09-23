using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class GenreRepository : Repository<Genre>, IGenreRepository
    {
        private readonly AppDbContext _context;

        public GenreRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Genre?> GetByNameAsync(string name)
        {
            return await _context.Genres
                .FirstOrDefaultAsync(g => g.Name == name);
        }

        public async Task<IEnumerable<Genre>> GetActiveGenres()
        {
            return await _context.Genres
                .OrderBy(g => g.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Genre>> GetGenresByGameCountAsync()
        {
            return await _context.Genres
                .Include(g => g.GameGenres)
                .OrderByDescending(g => g.GameGenres.Count)
                .ToListAsync();
        }

        public async Task<bool> IsGenreNameExistsAsync(string name)
        {
            return await _context.Genres
                .AnyAsync(g => g.Name == name);
        }

        public async Task<Genre?> GetByIgdbIdAsync(int igdbId)
        {
            return await _context.Genres
                .FirstOrDefaultAsync(g => g.IGDBId == igdbId);
        }

        public async Task<IEnumerable<Genre>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds)
        {
            return await _context.Genres
                .Where(g => igdbIds.Contains(g.IGDBId.Value))
                .ToListAsync();
        }

        public async Task<Genre> GetOrCreateByIgdbIdAsync(int igdbId, string name)
        {
            var existing = await GetByIgdbIdAsync(igdbId);
            if (existing != null)
                return existing;

            var newGenre = new Genre
            {
                IGDBId = igdbId,
                Name = name,
                CreatedDate = DateTime.UtcNow
            };

            await AddAsync(newGenre);
            await _context.SaveChangesAsync(); // Save immediately to get ID
            return newGenre;
        }
    }
}