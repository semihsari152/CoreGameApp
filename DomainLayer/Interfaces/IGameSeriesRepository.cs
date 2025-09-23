using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameSeriesRepository : IRepository<GameSeries>
    {
        Task<GameSeries?> GetByIgdbIdAsync(int igdbId);
        Task<GameSeries?> GetByNameAsync(string name);
        Task<IEnumerable<GameSeries>> GetByIgdbIdsAsync(IEnumerable<int> igdbIds);
        Task<IEnumerable<GameSeries>> GetAllWithGameCountAsync();
        Task<bool> ExistsByNameAsync(string name);
        Task<GameSeries?> GetByIdWithGamesAsync(int id);
    }
}