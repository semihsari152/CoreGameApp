using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameMediaRepository : IRepository<GameMedia>
    {
        Task<IEnumerable<GameMedia>> GetByGameIdAsync(int gameId);
        Task<IEnumerable<GameMedia>> GetByGameIdAndTypeAsync(int gameId, DomainLayer.Enums.MediaType mediaType);
        Task<GameMedia?> GetPrimaryByGameIdAsync(int gameId);
    }
}