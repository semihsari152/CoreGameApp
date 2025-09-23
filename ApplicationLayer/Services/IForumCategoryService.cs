using ApplicationLayer.DTOs;

namespace ApplicationLayer.Services
{
    public interface IForumCategoryService
    {
        Task<ForumCategoryDto?> GetForumCategoryByIdAsync(int id);
        Task<ForumCategoryDto?> GetForumCategoryByNameAsync(string name);
        Task<IEnumerable<ForumCategoryDto>> GetAllForumCategoriesAsync();
        Task<IEnumerable<ForumCategoryDto>> GetActiveForumCategoriesAsync();
        Task<IEnumerable<ForumCategoryDto>> GetForumCategoriesWithTopicsAsync();
        Task<ForumCategoryDto> CreateForumCategoryAsync(CreateForumCategoryDto createForumCategoryDto);
        Task<ForumCategoryDto> UpdateForumCategoryAsync(int id, UpdateForumCategoryDto updateForumCategoryDto);
        Task DeleteForumCategoryAsync(int id);
        Task<bool> IsForumCategoryNameExistsAsync(string name);
    }
}