using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IPlatformService
    {
        Task<List<PlatformDto>> GetAllAsync();
        Task<PlatformDto?> GetByIdAsync(int id);
        Task<PlatformDto> CreateAsync(PlatformDto platformDto);
        Task<PlatformDto?> UpdateAsync(int id, PlatformDto platformDto);
        Task<bool> DeleteAsync(int id);
    }
}