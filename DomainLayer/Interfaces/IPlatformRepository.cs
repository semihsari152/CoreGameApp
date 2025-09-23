using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IPlatformRepository : IRepository<Platform>
    {
        Task<Platform?> GetByIgdbIdAsync(int igdbId);
        Task<Platform?> GetByNameAsync(string name);
        Task<IEnumerable<Platform>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds);
        Task<Platform> GetOrCreateByIgdbIdAsync(int igdbId, string name);
    }
}