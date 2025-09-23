using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface ICommentRepository : IRepository<Comment>
    {
        Task<IEnumerable<Comment>> GetCommentsByEntityAsync(CommentableType type, int entityId);
        Task<IEnumerable<Comment>> GetCommentsByUserAsync(int userId);
        Task<IEnumerable<Comment>> GetRepliesAsync(int parentCommentId);
        Task<IEnumerable<Comment>> GetTopLevelCommentsAsync(CommentableType type, int entityId);
        Task<int> GetCommentCountByEntityAsync(CommentableType type, int entityId);
        Task SoftDeleteAsync(int commentId);
        Task<IEnumerable<Comment>> GetRecentCommentsAsync(int count);
    }
}