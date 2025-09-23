using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IGuideService
    {
        Task<GuideDto?> GetGuideByIdAsync(int id);
        Task<IEnumerable<GuideDto>> GetAllGuidesAsync();
        Task<IEnumerable<GuideDto>> GetGuidesByGameAsync(int gameId);
        Task<IEnumerable<GuideDto>> GetGuidesByUserAsync(int userId);
        Task<IEnumerable<GuideDto>> GetPublishedGuidesAsync();
        Task<IEnumerable<GuideDto>> GetTopRatedGuidesAsync(int count);
        Task<IEnumerable<GuideDto>> GetRecentGuidesAsync(int count);
        Task<IEnumerable<GuideDto>> SearchGuidesAsync(string searchTerm);
        Task<GuideDto> CreateGuideAsync(CreateGuideDto createGuideDto);
        Task<GuideDto> UpdateGuideAsync(int id, UpdateGuideDto updateGuideDto);
        Task DeleteGuideAsync(int id);
        Task PublishGuideAsync(int id);
        Task UnpublishGuideAsync(int id);
        Task IncrementViewCountAsync(int id);
        Task<bool> CanUserEditGuideAsync(int guideId, int userId);
    }
}