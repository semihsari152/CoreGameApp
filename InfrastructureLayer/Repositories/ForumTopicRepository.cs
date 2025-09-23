using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class ForumTopicRepository : Repository<ForumTopic>, IForumTopicRepository
    {
        private readonly AppDbContext _context;

        public ForumTopicRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ForumTopic>> GetTopicsByCategoryAsync(int categoryId)
        {
            return await _context.ForumTopics
                .Include(ft => ft.User)
                .Include(ft => ft.ForumCategory)
                .Where(ft => ft.ForumCategoryId == categoryId)
                .OrderByDescending(ft => ft.IsSticky)
                .ThenByDescending(ft => ft.UpdatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<ForumTopic>> GetTopicsByUserAsync(int userId)
        {
            return await _context.ForumTopics
                .Include(ft => ft.ForumCategory)
                .Where(ft => ft.UserId == userId)
                .OrderByDescending(ft => ft.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<ForumTopic>> GetStickyTopicsAsync()
        {
            return await _context.ForumTopics
                .Include(ft => ft.User)
                .Include(ft => ft.ForumCategory)
                .Where(ft => ft.IsSticky)
                .OrderByDescending(ft => ft.UpdatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<ForumTopic>> GetRecentTopicsAsync(int count)
        {
            return await _context.ForumTopics
                .Include(ft => ft.User)
                .Include(ft => ft.ForumCategory)
                .OrderByDescending(ft => ft.CreatedDate)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<ForumTopic>> SearchTopicsAsync(string searchTerm)
        {
            return await _context.ForumTopics
                .Include(ft => ft.User)
                .Include(ft => ft.ForumCategory)
                .Where(ft => ft.Title.Contains(searchTerm) || 
                           ft.Content.Contains(searchTerm))
                .OrderByDescending(ft => ft.UpdatedDate)
                .ToListAsync();
        }

        public async Task IncrementViewCountAsync(int topicId)
        {
            var topic = await _context.ForumTopics.FindAsync(topicId);
            if (topic != null)
            {
                topic.ViewCount++;
                topic.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task IncrementReplyCountAsync(int topicId)
        {
            var topic = await _context.ForumTopics.FindAsync(topicId);
            if (topic != null)
            {
                topic.ReplyCount++;
                topic.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task LockTopicAsync(int topicId)
        {
            var topic = await _context.ForumTopics.FindAsync(topicId);
            if (topic != null)
            {
                topic.IsLocked = true;
                topic.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UnlockTopicAsync(int topicId)
        {
            var topic = await _context.ForumTopics.FindAsync(topicId);
            if (topic != null)
            {
                topic.IsLocked = false;
                topic.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}