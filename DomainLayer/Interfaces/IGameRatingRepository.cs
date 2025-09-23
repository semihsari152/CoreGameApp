using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IGameRatingRepository : IRepository<GameRating>
    {
        Task<IEnumerable<GameRating>> GetRatingsByGameAsync(int gameId);
        Task<IEnumerable<GameRating>> GetRatingsByUserAsync(int userId);
        Task<GameRating?> GetUserRatingAsync(int userId, int gameId);
        Task<double> GetAverageRatingAsync(int gameId);
        Task<bool> HasUserRatedAsync(int userId, int gameId);
        Task<IEnumerable<GameRating>> GetByGameIdAsync(int gameId);
    }
}