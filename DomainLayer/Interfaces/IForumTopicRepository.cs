using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IForumTopicRepository : IRepository<ForumTopic>
    {
        Task<IEnumerable<ForumTopic>> GetTopicsByCategoryAsync(int categoryId);
        Task<IEnumerable<ForumTopic>> GetTopicsByUserAsync(int userId);
        Task<IEnumerable<ForumTopic>> GetStickyTopicsAsync();
        Task<IEnumerable<ForumTopic>> GetRecentTopicsAsync(int count);
        Task<IEnumerable<ForumTopic>> SearchTopicsAsync(string searchTerm);
        Task IncrementViewCountAsync(int topicId);
        Task IncrementReplyCountAsync(int topicId);
        Task LockTopicAsync(int topicId);
        Task UnlockTopicAsync(int topicId);
    }
}