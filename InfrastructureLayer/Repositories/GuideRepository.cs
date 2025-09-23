using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class GuideRepository : Repository<Guide>, IGuideRepository
    {
        private readonly AppDbContext _context;

        public GuideRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Guide>> GetGuidesByGameAsync(int gameId)
        {
            return await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.GameId == gameId && g.IsPublished)
                .OrderByDescending(g => g.AverageRating)
                .ToListAsync();
        }

        public async Task<IEnumerable<Guide>> GetGuidesByUserAsync(int userId)
        {
            return await _context.Guides
                .Include(g => g.Game)
                .Where(g => g.UserId == userId)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Guide>> GetPublishedGuidesAsync()
        {
            return await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished)
                .OrderByDescending(g => g.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Guide>> GetTopRatedGuidesAsync(int count)
        {
            return await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished && g.RatingCount > 0)
                .OrderByDescending(g => g.AverageRating)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Guide>> GetRecentGuidesAsync(int count)
        {
            return await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished)
                .OrderByDescending(g => g.CreatedDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Guide>> SearchGuidesAsync(string searchTerm)
        {
            return await _context.Guides
                .Include(g => g.User)
                .Include(g => g.Game)
                .Where(g => g.IsPublished && 
                           (g.Title.Contains(searchTerm) ||
                            g.Summary.Contains(searchTerm)))
                .OrderByDescending(g => g.AverageRating)
                .ToListAsync();
        }

        public async Task IncrementViewCountAsync(int guideId)
        {
            var guide = await _context.Guides.FindAsync(guideId);
            if (guide != null)
            {
                guide.ViewCount++;
                guide.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateAverageRatingAsync(int guideId)
        {
            var guide = await _context.Guides
                .Include(g => g.Likes)
                .FirstOrDefaultAsync(g => g.Id == guideId);

            if (guide != null && guide.Likes.Any())
            {
                var likes = guide.Likes.Where(l => l.IsLike).Count();
                var dislikes = guide.Likes.Where(l => !l.IsLike).Count();
                var total = likes + dislikes;
                
                if (total > 0)
                {
                    guide.AverageRating = (decimal)likes / total * 5;
                    guide.RatingCount = total;
                    guide.UpdatedDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}