using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameModeRepository : IRepository<GameMode>
    {
        Task<GameMode?> GetByIgdbIdAsync(int igdbId);
        Task<GameMode?> GetByNameAsync(string name);
        Task<IEnumerable<GameMode>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds);
        Task<GameMode> GetOrCreateByIgdbIdAsync(int igdbId, string name);
    }
}