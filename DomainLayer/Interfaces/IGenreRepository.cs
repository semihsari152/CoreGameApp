using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGenreRepository : IRepository<Genre>
    {
        Task<Genre?> GetByNameAsync(string name);
        Task<Genre?> GetByIgdbIdAsync(int igdbId);
        Task<IEnumerable<Genre>> GetActiveGenres();
        Task<IEnumerable<Genre>> GetGenresByGameCountAsync();
        Task<IEnumerable<Genre>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds);
        Task<bool> IsGenreNameExistsAsync(string name);
        Task<Genre> GetOrCreateByIgdbIdAsync(int igdbId, string name);
    }
}