using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class ConversationRepository : Repository<Conversation>, IConversationRepository
    {
        public ConversationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Conversation>> GetUserConversationsAsync(int userId)
        {
            var conversations = await _context.Set<Conversation>()
                .Include(c => c.Participants.Where(p => p.IsActive))
                    .ThenInclude(p => p.User)
                .Where(c => c.Participants.Any(p => p.UserId == userId && p.IsActive) && c.IsActive)
                .ToListAsync();

            // Her konuşma için en son mesajı manuel olarak set et
            foreach (var conversation in conversations)
            {
                var lastMessage = await _context.Set<Message>()
                    .Include(m => m.Sender)
                    .Where(m => m.ConversationId == conversation.Id && !m.IsDeleted)
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                conversation.LastMessage = lastMessage;
                if (lastMessage != null)
                {
                    conversation.LastMessageAt = lastMessage.CreatedAt;
                }
            }

            return conversations.OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt);
        }

        public async Task<Conversation?> GetDirectMessageConversationAsync(int user1Id, int user2Id)
        {
            return await _context.Set<Conversation>()
                .Include(c => c.Participants)
                    .ThenInclude(p => p.User)
                .Where(c => c.Type == ConversationType.DirectMessage && c.IsActive)
                .Where(c => c.Participants.Count(p => p.IsActive) == 2)
                .Where(c => c.Participants.Any(p => p.UserId == user1Id && p.IsActive) &&
                           c.Participants.Any(p => p.UserId == user2Id && p.IsActive))
                .FirstOrDefaultAsync();
        }

        public async Task<Conversation?> GetConversationWithParticipantsAsync(int conversationId)
        {
            return await _context.Set<Conversation>()
                .Include(c => c.Participants.Where(p => p.IsActive))
                    .ThenInclude(p => p.User)
                .Include(c => c.CreatedBy)
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive);
        }

        public async Task<Conversation?> GetConversationWithAllParticipantsAsync(int conversationId)
        {
            return await _context.Set<Conversation>()
                .Include(c => c.Participants) // Include ALL participants (active and inactive)
                    .ThenInclude(p => p.User)
                .Include(c => c.CreatedBy)
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive);
        }

        public async Task<Conversation?> GetConversationWithMessagesAsync(int conversationId, int skip = 0, int take = 50)
        {
            return await _context.Set<Conversation>()
                .Include(c => c.Participants.Where(p => p.IsActive))
                    .ThenInclude(p => p.User)
                .Include(c => c.Messages.Where(m => !m.IsDeleted)
                    .OrderByDescending(m => m.CreatedAt)
                    .Skip(skip)
                    .Take(take))
                    .ThenInclude(m => m.Sender)
                .Include(c => c.Messages.Where(m => !m.IsDeleted)
                    .OrderByDescending(m => m.CreatedAt)
                    .Skip(skip)
                    .Take(take))
                    .ThenInclude(m => m.ReplyToMessage)
                        .ThenInclude(rm => rm.Sender)
                .Include(c => c.Messages.Where(m => !m.IsDeleted)
                    .OrderByDescending(m => m.CreatedAt)
                    .Skip(skip)
                    .Take(take))
                    .ThenInclude(m => m.Reactions)
                        .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsActive);
        }

        public async Task<bool> IsUserInConversationAsync(int userId, int conversationId)
        {
            return await _context.Set<ConversationParticipant>()
                .AnyAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId && cp.IsActive);
        }

        public async Task<IEnumerable<Conversation>> SearchConversationsAsync(int userId, string query)
        {
            return await _context.Set<Conversation>()
                .Include(c => c.Participants.Where(p => p.IsActive))
                    .ThenInclude(p => p.User)
                .Include(c => c.LastMessage)
                .Where(c => c.Participants.Any(p => p.UserId == userId && p.IsActive) && c.IsActive)
                .Where(c => c.Title != null && c.Title.Contains(query) ||
                           c.Participants.Any(p => p.User.Username.Contains(query) || 
                                                 (p.User.FirstName != null && p.User.FirstName.Contains(query)) ||
                                                 (p.User.LastName != null && p.User.LastName.Contains(query))))
                .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
                .ToListAsync();
        }
    }
}