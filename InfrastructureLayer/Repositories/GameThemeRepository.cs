using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameThemeRepository : Repository<GameTheme>, IGameThemeRepository
    {
        public GameThemeRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GameTheme>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameThemes.Where(gt => gt.GameId == gameId).ToListAsync();
        }

        public async Task<IEnumerable<GameTheme>> GetByThemeIdAsync(int themeId)
        {
            return await _context.GameThemes.Where(gt => gt.ThemeId == themeId).ToListAsync();
        }
    }
}