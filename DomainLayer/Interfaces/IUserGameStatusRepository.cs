using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface IUserGameStatusRepository : IRepository<UserGameStatus>
    {
        Task<IEnumerable<UserGameStatus>> GetUserGameStatusesByUserAsync(int userId);
        Task<UserGameStatus?> GetUserGameStatusAsync(int userId, int gameId);
        Task<IEnumerable<UserGameStatus>> GetGamesByStatusAsync(int userId, GameListType status);
        Task<bool> UserHasGameStatusAsync(int userId, int gameId);
        Task RemoveUserGameStatusAsync(int userId, int gameId);
    }
}