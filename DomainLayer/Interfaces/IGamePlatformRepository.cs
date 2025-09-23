using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGamePlatformRepository : IRepository<GamePlatform>
    {
        Task<IEnumerable<GamePlatform>> GetByGameIdAsync(int gameId);
    }
}