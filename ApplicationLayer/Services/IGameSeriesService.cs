using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IGameSeriesService
    {
        Task<IEnumerable<GameSeriesDto>> GetAllGameSeriesAsync();
        Task<GameSeriesDto?> GetGameSeriesByIdAsync(int id);
        Task<GameSeriesDto> CreateGameSeriesAsync(CreateGameSeriesDto createDto);
        Task<GameSeriesDto> UpdateGameSeriesAsync(int id, UpdateGameSeriesDto updateDto);
        Task<bool> DeleteGameSeriesAsync(int id);
        Task<bool> ExistsByNameAsync(string name);
        Task<IEnumerable<GameSeriesDto>> SearchGameSeriesAsync(string searchTerm);
    }
}