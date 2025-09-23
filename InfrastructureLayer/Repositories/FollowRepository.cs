using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class FollowRepository : Repository<Follow>, IFollowRepository
    {
        public FollowRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Follow?> GetByUsersAsync(int followerId, int followingId)
        {
            return await _context.Set<Follow>()
                .Include(f => f.Follower)
                .Include(f => f.Following)
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
        }

        public async Task<IEnumerable<Follow>> GetFollowersAsync(int userId)
        {
            return await _context.Set<Follow>()
                .Include(f => f.Follower)
                .Include(f => f.Following)
                .Where(f => f.FollowingId == userId && f.IsActive)
                .OrderByDescending(f => f.FollowedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Follow>> GetFollowingAsync(int userId)
        {
            return await _context.Set<Follow>()
                .Include(f => f.Follower)
                .Include(f => f.Following)
                .Where(f => f.FollowerId == userId && f.IsActive)
                .OrderByDescending(f => f.FollowedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetFollowerUsersAsync(int userId)
        {
            return await _context.Set<Follow>()
                .Include(f => f.Follower)
                .Where(f => f.FollowingId == userId && f.IsActive)
                .Select(f => f.Follower)
                .OrderByDescending(f => f.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetFollowingUsersAsync(int userId)
        {
            return await _context.Set<Follow>()
                .Include(f => f.Following)
                .Where(f => f.FollowerId == userId && f.IsActive)
                .Select(f => f.Following)
                .OrderByDescending(f => f.CreatedDate)
                .ToListAsync();
        }

        public async Task<bool> IsFollowingAsync(int followerId, int followingId)
        {
            return await _context.Set<Follow>()
                .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId && f.IsActive);
        }

        public async Task<int> GetFollowersCountAsync(int userId)
        {
            return await _context.Set<Follow>()
                .CountAsync(f => f.FollowingId == userId && f.IsActive);
        }

        public async Task<int> GetFollowingCountAsync(int userId)
        {
            return await _context.Set<Follow>()
                .CountAsync(f => f.FollowerId == userId && f.IsActive);
        }
    }
}