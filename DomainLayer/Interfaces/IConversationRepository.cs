using DomainLayer.Entities;
using DomainLayer.Enums;

namespace DomainLayer.Interfaces
{
    public interface IConversationRepository : IRepository<Conversation>
    {
        Task<IEnumerable<Conversation>> GetUserConversationsAsync(int userId);
        Task<Conversation?> GetDirectMessageConversationAsync(int user1Id, int user2Id);
        Task<Conversation?> GetConversationWithParticipantsAsync(int conversationId);
        Task<Conversation?> GetConversationWithAllParticipantsAsync(int conversationId);
        Task<Conversation?> GetConversationWithMessagesAsync(int conversationId, int skip = 0, int take = 50);
        Task<bool> IsUserInConversationAsync(int userId, int conversationId);
        Task<IEnumerable<Conversation>> SearchConversationsAsync(int userId, string query);
    }
}