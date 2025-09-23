using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameThemeRepository : IRepository<GameTheme>
    {
        Task<IEnumerable<GameTheme>> GetByGameIdAsync(int gameId);
        Task<IEnumerable<GameTheme>> GetByThemeIdAsync(int themeId);
    }
}