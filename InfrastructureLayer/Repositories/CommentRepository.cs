using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class CommentRepository : Repository<Comment>, ICommentRepository
    {
        private readonly AppDbContext _context;

        public CommentRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comment>> GetCommentsByEntityAsync(CommentableType type, int entityId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Include(c => c.ChildComments)
                .Where(c => c.CommentableType == type && c.TargetEntityId == entityId && !c.IsDeleted)
                .OrderBy(c => c.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetCommentsByUserAsync(int userId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Where(c => c.UserId == userId && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetRepliesAsync(int parentCommentId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Where(c => c.ParentCommentId == parentCommentId && !c.IsDeleted)
                .OrderBy(c => c.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetTopLevelCommentsAsync(CommentableType type, int entityId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Include(c => c.ChildComments.Where(cc => !cc.IsDeleted))
                .Where(c => c.CommentableType == type && 
                           c.TargetEntityId == entityId && 
                           c.ParentCommentId == null && 
                           !c.IsDeleted)
                .OrderBy(c => c.CreatedDate)
                .ToListAsync();
        }

        public async Task<int> GetCommentCountByEntityAsync(CommentableType type, int entityId)
        {
            return await _context.Comments
                .CountAsync(c => c.CommentableType == type && 
                               c.TargetEntityId == entityId && 
                               !c.IsDeleted);
        }

        public async Task SoftDeleteAsync(int commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment != null)
            {
                comment.IsDeleted = true;
                comment.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Comment>> GetRecentCommentsAsync(int count)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.CreatedDate)
                .Take(count)
                .ToListAsync();
        }
    }
}