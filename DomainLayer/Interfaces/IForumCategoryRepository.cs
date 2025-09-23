using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IForumCategoryRepository : IRepository<ForumCategory>
    {
        Task<ForumCategory?> GetByNameAsync(string name);
        Task<IEnumerable<ForumCategory>> GetActiveForumCategoriesAsync();
        Task<IEnumerable<ForumCategory>> GetForumCategoriesWithTopicsAsync();
        Task<bool> IsForumCategoryNameExistsAsync(string name);
    }
}