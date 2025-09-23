using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class BlogPostRepository : Repository<BlogPost>, IBlogPostRepository
    {
        private readonly AppDbContext _context;

        public BlogPostRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BlogPost>> GetBlogPostsByUserAsync(int userId)
        {
            return await _context.BlogPosts
                .Where(bp => bp.UserId == userId)
                .OrderByDescending(bp => bp.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<BlogPost>> GetPublishedBlogPostsAsync()
        {
            return await _context.BlogPosts
                .Include(bp => bp.User)
                .Where(bp => bp.IsPublished)
                .OrderByDescending(bp => bp.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<BlogPost>> GetRecentBlogPostsAsync(int count)
        {
            return await _context.BlogPosts
                .Include(bp => bp.User)
                .Where(bp => bp.IsPublished)
                .OrderByDescending(bp => bp.CreatedDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<BlogPost>> SearchBlogPostsAsync(string searchTerm)
        {
            return await _context.BlogPosts
                .Include(bp => bp.User)
                .Where(bp => bp.IsPublished && 
                           (bp.Title.Contains(searchTerm) || 
                            bp.Content.Contains(searchTerm) ||
                            bp.Summary.Contains(searchTerm)))
                .OrderByDescending(bp => bp.CreatedDate)
                .ToListAsync();
        }

        public async Task IncrementViewCountAsync(int blogPostId)
        {
            var blogPost = await _context.BlogPosts.FindAsync(blogPostId);
            if (blogPost != null)
            {
                blogPost.ViewCount++;
                blogPost.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<BlogPost>> GetBlogPostsByTagAsync(int tagId)
        {
            return await _context.BlogPosts
                .Include(bp => bp.User)
                .Where(bp => bp.IsPublished && 
                           bp.BlogPostTags.Any(bpt => bpt.TagId == tagId))
                .OrderByDescending(bp => bp.CreatedDate)
                .ToListAsync();
        }
    }
}