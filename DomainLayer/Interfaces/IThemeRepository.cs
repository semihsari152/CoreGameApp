using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IThemeRepository : IRepository<Theme>
    {
        Task<Theme?> GetByIgdbIdAsync(int igdbId);
        Task<Theme?> GetByNameAsync(string name);
        Task<IEnumerable<Theme>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds);
        Task<Theme> GetOrCreateByIgdbIdAsync(int igdbId, string name);
    }
}