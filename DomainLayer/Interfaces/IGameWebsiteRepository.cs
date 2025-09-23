using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameWebsiteRepository : IRepository<GameWebsite>
    {
        Task<IEnumerable<GameWebsite>> GetByGameIdAsync(int gameId);
        Task<IEnumerable<GameWebsite>> GetByGameIdAndTypeAsync(int gameId, DomainLayer.Enums.WebsiteType websiteType);
    }
}