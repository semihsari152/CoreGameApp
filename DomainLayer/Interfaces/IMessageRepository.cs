using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IMessageRepository : IRepository<Message>
    {
        Task<IEnumerable<Message>> GetConversationMessagesAsync(int conversationId, int skip = 0, int take = 50);
        Task<Message?> GetMessageWithDetailsAsync(int messageId);
        Task<IEnumerable<Message>> GetUnreadMessagesAsync(int userId, int conversationId);
        Task<int> GetUnreadMessageCountAsync(int userId, int conversationId);
        Task<IEnumerable<Message>> SearchMessagesAsync(int conversationId, string query);
        Task<Message?> GetLastMessageAsync(int conversationId);
        Task DeleteMessageAsync(int messageId);
        Task ClearConversationMessagesAsync(int conversationId);
    }
}