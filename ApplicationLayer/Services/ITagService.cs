using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface ITagService
    {
        Task<TagDto?> GetTagByIdAsync(int id);
        Task<TagDto?> GetTagByNameAsync(string name);
        Task<IEnumerable<TagDto>> GetAllTagsAsync();
        Task<IEnumerable<TagDto>> GetPopularTagsAsync(int count);
        Task<IEnumerable<TagDto>> SearchTagsAsync(string searchTerm);
        Task<TagDto> CreateTagAsync(CreateTagDto createTagDto);
        Task<TagDto> UpdateTagAsync(int id, UpdateTagDto updateTagDto);
        Task DeleteTagAsync(int id);
        Task<bool> IsTagNameExistsAsync(string name);
    }
}