using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Repositories
{
    public class GameGenreRepository : Repository<GameGenre>, IGameGenreRepository
    {
        public GameGenreRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<GameGenre>> GetByGameIdAsync(int gameId)
        {
            return await _context.GameGenres.Where(gg => gg.GameId == gameId).ToListAsync();
        }

        public async Task<IEnumerable<GameGenre>> GetByGenreIdAsync(int genreId)
        {
            return await _context.GameGenres.Where(gg => gg.GenreId == genreId).ToListAsync();
        }
    }
}