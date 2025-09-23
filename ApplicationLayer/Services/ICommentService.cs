using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface ICommentService
    {
        Task<CommentDto?> GetCommentByIdAsync(int id);
        Task<IEnumerable<CommentDto>> GetCommentsByEntityAsync(CommentableType commentableType, int entityId);
        Task<IEnumerable<CommentDto>> GetCommentsByEntityAsync(CommentableType commentableType, int entityId, int? currentUserId);
        Task<IEnumerable<CommentDto>> GetCommentsByUserAsync(int userId);
        Task<CommentDto> CreateCommentAsync(int userId, CreateCommentDto createCommentDto);
        Task<CommentDto> UpdateCommentAsync(int id, int userId, UpdateCommentDto updateCommentDto);
        Task<bool> DeleteCommentAsync(int id, int userId);
        Task<bool> LikeCommentAsync(int commentId, int userId);
        Task<bool> UnlikeCommentAsync(int commentId, int userId);
        Task<bool> DislikeCommentAsync(int commentId, int userId);
        Task<bool> UndislikeCommentAsync(int commentId, int userId);
        Task<int> GetCommentsCountAsync(CommentableType commentableType, int entityId);
        Task<bool> ToggleStickyAsync(int commentId, int userId);
        Task<bool> ToggleBestAnswerAsync(int commentId, int userId);
    }
}