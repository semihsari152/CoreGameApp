using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameGenreRepository : IRepository<GameGenre>
    {
        Task<IEnumerable<GameGenre>> GetByGameIdAsync(int gameId);
        Task<IEnumerable<GameGenre>> GetByGenreIdAsync(int genreId);
    }
}