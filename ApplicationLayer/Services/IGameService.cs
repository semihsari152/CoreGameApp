using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface IGameService
    {
        Task<GameDto?> GetGameByIdAsync(int id);
        Task<IEnumerable<GameDto>> GetAllGamesAsync();
        Task<IEnumerable<GameDto>> SearchGamesAsync(string searchTerm);
        Task<IEnumerable<GameDto>> FilterGamesAsync(List<DomainLayer.Enums.Platform>? platforms, List<int>? categoryIds, List<int>? tagIds, int? minRating, int? maxRating);
        Task<GameDto> CreateGameAsync(CreateGameDto createGameDto);
        Task<GameDto> UpdateGameAsync(int id, UpdateGameDto updateGameDto);
        Task<bool> DeleteGameAsync(int id);
        Task<bool> RateGameAsync(int gameId, int userId, int rating, string? review);
        Task<decimal> GetGameAverageRatingAsync(int gameId);
        Task<IEnumerable<GameDto>> GetPopularGamesAsync(int count = 10);
        Task<IEnumerable<GameDto>> GetRecentGamesAsync(int count = 10);
        Task<IEnumerable<GameDto>> GetSimilarGamesAsync(int gameId, int count = 10);
        Task<IEnumerable<GameDto>> GetTopRatedGamesAsync(int count = 20);
        Task<IEnumerable<GameDto>> GetGamesByGenreAsync(int genreId);
        Task<GameRatingDto> RateGameAsync(CreateGameRatingDto ratingDto);
    }
}