using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameTagRepository : IRepository<GameTag>
    {
        Task<IEnumerable<GameTag>> GetByGameIdAsync(int gameId);
        Task<IEnumerable<GameTag>> GetByTagIdAsync(int tagId);
    }
}