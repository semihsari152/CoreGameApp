using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IGameRatingService
    {
        Task<GameRatingDto?> GetGameRatingByIdAsync(int id);
        Task<IEnumerable<GameRatingDto>> GetRatingsByGameAsync(int gameId);
        Task<IEnumerable<GameRatingDto>> GetRatingsByUserAsync(int userId);
        Task<GameRatingDto?> GetUserRatingAsync(int userId, int gameId);
        Task<double> GetAverageRatingAsync(int gameId);
        Task<bool> HasUserRatedAsync(int userId, int gameId);
        Task<GameRatingDto> CreateGameRatingAsync(CreateGameRatingDto createGameRatingDto);
        Task<GameRatingDto> UpdateGameRatingAsync(int id, UpdateGameRatingDto updateGameRatingDto);
        Task DeleteGameRatingAsync(int id);
        Task<GameRatingStatsDto> GetRatingStatsAsync(int gameId);
    }
}