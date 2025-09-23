using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using DomainLayer.Enums;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class UserGameStatusRepository : Repository<UserGameStatus>, IUserGameStatusRepository
    {
        private readonly AppDbContext _context;

        public UserGameStatusRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserGameStatus>> GetUserGameStatusesByUserAsync(int userId)
        {
            return await _context.UserGameStatuses
                .Include(ugs => ugs.Game)
                .Where(ugs => ugs.UserId == userId)
                .OrderByDescending(ugs => ugs.UpdatedDate)
                .ToListAsync();
        }

        public async Task<UserGameStatus?> GetUserGameStatusAsync(int userId, int gameId)
        {
            return await _context.UserGameStatuses
                .Include(ugs => ugs.Game)
                .FirstOrDefaultAsync(ugs => ugs.UserId == userId && ugs.GameId == gameId);
        }

        public async Task<IEnumerable<UserGameStatus>> GetGamesByStatusAsync(int userId, GameListType status)
        {
            return await _context.UserGameStatuses
                .Include(ugs => ugs.Game)
                .Where(ugs => ugs.UserId == userId && ugs.Status == status)
                .OrderByDescending(ugs => ugs.UpdatedDate)
                .ToListAsync();
        }

        public async Task<bool> UserHasGameStatusAsync(int userId, int gameId)
        {
            return await _context.UserGameStatuses
                .AnyAsync(ugs => ugs.UserId == userId && ugs.GameId == gameId);
        }

        public async Task RemoveUserGameStatusAsync(int userId, int gameId)
        {
            var userGameStatus = await _context.UserGameStatuses
                .FirstOrDefaultAsync(ugs => ugs.UserId == userId && ugs.GameId == gameId);
            
            if (userGameStatus != null)
            {
                _context.UserGameStatuses.Remove(userGameStatus);
            }
        }
    }
}