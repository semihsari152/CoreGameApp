using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IGenreService
    {
        Task<GenreDto?> GetGenreByIdAsync(int id);
        Task<GenreDto?> GetGenreByNameAsync(string name);
        Task<IEnumerable<GenreDto>> GetAllGenresAsync();
        Task<IEnumerable<GenreDto>> GetActiveGenresAsync();
        Task<IEnumerable<GenreDto>> GetGenresByGameCountAsync();
        Task<GenreDto> CreateGenreAsync(CreateGenreDto createGenreDto);
        Task<GenreDto> UpdateGenreAsync(int id, UpdateGenreDto updateGenreDto);
        Task DeleteGenreAsync(int id);
        Task<bool> IsGenreNameExistsAsync(string name);
    }
}