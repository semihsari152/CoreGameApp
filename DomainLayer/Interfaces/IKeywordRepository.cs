using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IKeywordRepository : IRepository<Keyword>
    {
        Task<Keyword?> GetByIgdbIdAsync(int igdbId);
        Task<Keyword> GetOrCreateByIgdbIdAsync(int igdbId, string name);
    }
}