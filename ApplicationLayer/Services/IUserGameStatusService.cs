using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface IUserGameStatusService
    {
        Task<UserGameStatusDto?> GetUserGameStatusAsync(int userId, int gameId);
        Task<IEnumerable<UserGameStatusDto>> GetUserGameStatusesAsync(int userId);
        Task<IEnumerable<UserGameStatusDto>> GetGamesByStatusAsync(int userId, GameListType status);
        Task<UserGameStatusDto> CreateOrUpdateUserGameStatusAsync(int userId, CreateUserGameStatusDto createDto);
        Task<UserGameStatusDto> UpdateUserGameStatusAsync(int userId, int gameId, UpdateUserGameStatusDto updateDto);
        Task RemoveUserGameStatusAsync(int userId, int gameId);
        Task<bool> UserHasGameStatusAsync(int userId, int gameId);
    }
}