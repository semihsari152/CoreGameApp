using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class LikeRepository : Repository<Like>, ILikeRepository
    {
        private readonly AppDbContext _context;

        public LikeRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Like>> GetLikesByEntityAsync(LikableType type, int entityId)
        {
            return await _context.Likes
                .Include(l => l.User)
                .Where(l => l.LikableType == type && l.TargetEntityId == entityId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Like>> GetLikesByUserAsync(int userId)
        {
            return await _context.Likes
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedDate)
                .ToListAsync();
        }

        public async Task<Like?> GetUserLikeAsync(int userId, LikableType type, int entityId)
        {
            return await _context.Likes
                .FirstOrDefaultAsync(l => l.UserId == userId && 
                                        l.LikableType == type && 
                                        l.TargetEntityId == entityId);
        }

        public async Task<int> GetLikeCountAsync(LikableType type, int entityId, bool isLike)
        {
            return await _context.Likes
                .CountAsync(l => l.LikableType == type && 
                               l.TargetEntityId == entityId && 
                               l.IsLike == isLike);
        }

        public async Task<bool> HasUserLikedAsync(int userId, LikableType type, int entityId)
        {
            return await _context.Likes
                .AnyAsync(l => l.UserId == userId && 
                             l.LikableType == type && 
                             l.TargetEntityId == entityId);
        }

        public async Task ToggleLikeAsync(int userId, LikableType type, int entityId, bool isLike)
        {
            var existingLike = await GetUserLikeAsync(userId, type, entityId);
            
            if (existingLike != null)
            {
                if (existingLike.IsLike == isLike)
                {
                    _context.Likes.Remove(existingLike);
                }
                else
                {
                    existingLike.IsLike = isLike;
                    existingLike.CreatedDate = DateTime.UtcNow;
                }
            }
            else
            {
                var newLike = new Like
                {
                    UserId = userId,
                    LikableType = type,
                    TargetEntityId = entityId,
                    IsLike = isLike,
                    CreatedDate = DateTime.UtcNow
                };
                await _context.Likes.AddAsync(newLike);
            }
            
            await _context.SaveChangesAsync();
        }
    }
}