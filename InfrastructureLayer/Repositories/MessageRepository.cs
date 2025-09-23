using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class MessageRepository : Repository<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Message>> GetConversationMessagesAsync(int conversationId, int skip = 0, int take = 50)
        {
            return await _context.Set<Message>()
                .Include(m => m.Sender)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .Include(m => m.MessageReads)
                    .ThenInclude(mr => mr.User)
                .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
                .OrderBy(m => m.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Message?> GetMessageWithDetailsAsync(int messageId)
        {
            return await _context.Set<Message>()
                .Include(m => m.Sender)
                .Include(m => m.Conversation)
                .Include(m => m.ReplyToMessage)
                    .ThenInclude(rm => rm.Sender)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.User)
                .Include(m => m.MessageReads)
                    .ThenInclude(mr => mr.User)
                .FirstOrDefaultAsync(m => m.Id == messageId && !m.IsDeleted);
        }

        public async Task<IEnumerable<Message>> GetUnreadMessagesAsync(int userId, int conversationId)
        {
            // Get the user's last read message timestamp for this conversation
            var lastReadTime = await _context.Set<ConversationParticipant>()
                .Where(cp => cp.ConversationId == conversationId && cp.UserId == userId)
                .Select(cp => cp.LastReadAt)
                .FirstOrDefaultAsync();

            return await _context.Set<Message>()
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversationId && 
                           !m.IsDeleted &&
                           m.SenderId != userId && // Don't include own messages
                           (lastReadTime == null || m.CreatedAt > lastReadTime))
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetUnreadMessageCountAsync(int userId, int conversationId)
        {
            // Get the user's last read message timestamp for this conversation
            var lastReadTime = await _context.Set<ConversationParticipant>()
                .Where(cp => cp.ConversationId == conversationId && cp.UserId == userId)
                .Select(cp => cp.LastReadAt)
                .FirstOrDefaultAsync();

            return await _context.Set<Message>()
                .CountAsync(m => m.ConversationId == conversationId && 
                                !m.IsDeleted &&
                                m.SenderId != userId && // Don't include own messages
                                (lastReadTime == null || m.CreatedAt > lastReadTime));
        }

        public async Task<IEnumerable<Message>> SearchMessagesAsync(int conversationId, string query)
        {
            return await _context.Set<Message>()
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversationId && 
                           !m.IsDeleted &&
                           m.Content != null &&
                           m.Content.Contains(query))
                .OrderByDescending(m => m.CreatedAt)
                .Take(50)
                .ToListAsync();
        }

        public async Task<Message?> GetLastMessageAsync(int conversationId)
        {
            return await _context.Set<Message>()
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task DeleteMessageAsync(int messageId)
        {
            var message = await _context.Set<Message>()
                .FirstOrDefaultAsync(m => m.Id == messageId);
            
            if (message != null)
            {
                message.IsDeleted = true;
                message.UpdatedAt = DateTime.UtcNow;
                _context.Set<Message>().Update(message);
            }
        }

        public async Task ClearConversationMessagesAsync(int conversationId)
        {
            var messages = await _context.Set<Message>()
                .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
                .ToListAsync();

            foreach (var message in messages)
            {
                message.IsDeleted = true;
                message.UpdatedAt = DateTime.UtcNow;
            }

            _context.Set<Message>().UpdateRange(messages);
        }
    }
}