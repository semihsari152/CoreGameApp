using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IThemeService
    {
        Task<List<ThemeDto>> GetAllAsync();
        Task<ThemeDto?> GetByIdAsync(int id);
        Task<ThemeDto> CreateAsync(ThemeDto themeDto);
        Task<ThemeDto?> UpdateAsync(int id, ThemeDto themeDto);
        Task<bool> DeleteAsync(int id);
    }
}