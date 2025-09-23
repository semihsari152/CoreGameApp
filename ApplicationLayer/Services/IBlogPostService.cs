using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IBlogPostService
    {
        Task<BlogPostDto?> GetBlogPostByIdAsync(int id);
        Task<IEnumerable<BlogPostDto>> GetAllBlogPostsAsync();
        Task<IEnumerable<BlogPostDto>> GetBlogPostsByUserAsync(int userId);
        Task<IEnumerable<BlogPostDto>> GetPublishedBlogPostsAsync();
        Task<IEnumerable<BlogPostDto>> GetRecentBlogPostsAsync(int count);
        Task<IEnumerable<BlogPostDto>> SearchBlogPostsAsync(string searchTerm);
        Task<IEnumerable<BlogPostDto>> GetBlogPostsByTagAsync(int tagId);
        Task<BlogPostDto> CreateBlogPostAsync(CreateBlogPostDto createBlogPostDto);
        Task<BlogPostDto> UpdateBlogPostAsync(int id, UpdateBlogPostDto updateBlogPostDto);
        Task DeleteBlogPostAsync(int id);
        Task PublishBlogPostAsync(int id);
        Task UnpublishBlogPostAsync(int id);
        Task IncrementViewCountAsync(int id);
        Task<bool> CanUserEditBlogPostAsync(int blogPostId, int userId);
    }
}