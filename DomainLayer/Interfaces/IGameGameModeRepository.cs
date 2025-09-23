using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameGameModeRepository : IRepository<GameGameMode>
    {
        Task<IEnumerable<GameGameMode>> GetByGameIdAsync(int gameId);
        Task<IEnumerable<GameGameMode>> GetByGameModeIdAsync(int gameModeId);
    }
}