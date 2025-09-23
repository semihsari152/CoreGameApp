using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IBlogPostRepository : IRepository<BlogPost>
    {
        Task<IEnumerable<BlogPost>> GetBlogPostsByUserAsync(int userId);
        Task<IEnumerable<BlogPost>> GetPublishedBlogPostsAsync();
        Task<IEnumerable<BlogPost>> GetRecentBlogPostsAsync(int count);
        Task<IEnumerable<BlogPost>> SearchBlogPostsAsync(string searchTerm);
        Task IncrementViewCountAsync(int blogPostId);
        Task<IEnumerable<BlogPost>> GetBlogPostsByTagAsync(int tagId);
    }
}