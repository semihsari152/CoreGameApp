using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface ITagRepository : IRepository<Tag>
    {
        Task<Tag?> GetByNameAsync(string name);
        Task<Tag?> GetByIgdbIdAsync(int igdbId);
        Task<IEnumerable<Tag>> GetPopularTagsAsync(int count);
        Task<IEnumerable<Tag>> SearchTagsAsync(string searchTerm);
        Task<IEnumerable<Tag>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds);
        Task<bool> IsTagNameExistsAsync(string name);
    }
}