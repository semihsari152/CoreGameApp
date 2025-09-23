using DomainLayer.Entities;
using DomainLayer.Enums;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class FavoriteRepository : Repository<Favorite>
    {
        private readonly AppDbContext _context;

        public FavoriteRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Favorite>> GetUserFavoritesAsync(int userId, FavoriteType? favoriteType = null)
        {
            var query = _context.Favorites.Where(f => f.UserId == userId);

            if (favoriteType.HasValue)
            {
                query = query.Where(f => f.FavoriteType == favoriteType.Value);
            }

            return await query
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedDate)
                .ToListAsync();
        }

        public async Task<Favorite?> GetUserFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId)
        {
            return await _context.Favorites
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.UserId == userId && 
                                        f.FavoriteType == favoriteType && 
                                        f.TargetEntityId == targetEntityId);
        }

        public async Task<bool> RemoveFavoriteAsync(int userId, FavoriteType favoriteType, int targetEntityId)
        {
            var favorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && 
                                        f.FavoriteType == favoriteType && 
                                        f.TargetEntityId == targetEntityId);

            if (favorite == null)
                return false;

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetFavoriteCountAsync(FavoriteType favoriteType, int targetEntityId)
        {
            return await _context.Favorites
                .CountAsync(f => f.FavoriteType == favoriteType && f.TargetEntityId == targetEntityId);
        }
    }
}