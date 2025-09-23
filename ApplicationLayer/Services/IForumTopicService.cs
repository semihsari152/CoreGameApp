using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IForumTopicService
    {
        Task<ForumTopicDto?> GetForumTopicByIdAsync(int id);
        Task<IEnumerable<ForumTopicDto>> GetAllForumTopicsAsync();
        Task<IEnumerable<ForumTopicDto>> GetTopicsByCategoryAsync(int categoryId);
        Task<IEnumerable<ForumTopicDto>> GetTopicsByUserAsync(int userId);
        Task<IEnumerable<ForumTopicDto>> GetStickyTopicsAsync();
        Task<IEnumerable<ForumTopicDto>> GetRecentTopicsAsync(int count);
        Task<IEnumerable<ForumTopicDto>> SearchTopicsAsync(string searchTerm);
        Task<ForumTopicDto> CreateForumTopicAsync(CreateForumTopicDto createForumTopicDto);
        Task<ForumTopicDto> UpdateForumTopicAsync(int id, UpdateForumTopicDto updateForumTopicDto);
        Task DeleteForumTopicAsync(int id);
        Task IncrementViewCountAsync(int id);
        Task LockTopicAsync(int id);
        Task UnlockTopicAsync(int id);
        Task MakeStickyAsync(int id);
        Task RemoveStickyAsync(int id);
        Task<bool> CanUserEditTopicAsync(int topicId, int userId);
    }
}