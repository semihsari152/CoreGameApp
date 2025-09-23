using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class GenreService : IGenreService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public GenreService(IUnitOfWork unitOfWork, IMapper mapper, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _context = context;
        }

        public async Task<GenreDto?> GetGenreByIdAsync(int id)
        {
            var genre = await _unitOfWork.Genres.GetByIdAsync(id);
            return genre == null ? null : _mapper.Map<GenreDto>(genre);
        }

        public async Task<GenreDto?> GetGenreByNameAsync(string name)
        {
            var genre = await _unitOfWork.Genres.FirstOrDefaultAsync(g => g.Name == name);
            return genre == null ? null : _mapper.Map<GenreDto>(genre);
        }

        public async Task<IEnumerable<GenreDto>> GetAllGenresAsync()
        {
            var genres = await _unitOfWork.Genres.GetAllAsync();
            return _mapper.Map<IEnumerable<GenreDto>>(genres);
        }

        public async Task<IEnumerable<GenreDto>> GetActiveGenresAsync()
        {
            var genres = await _unitOfWork.Genres.GetAllAsync();
            return _mapper.Map<IEnumerable<GenreDto>>(genres);
        }

        public async Task<IEnumerable<GenreDto>> GetGenresByGameCountAsync()
        {
            var genres = await _context.Genres
                .Include(g => g.GameGenres)
                .Where(g => true)
                .OrderByDescending(g => g.GameGenres.Count)
                .ToListAsync();

            return _mapper.Map<IEnumerable<GenreDto>>(genres);
        }

        public async Task<GenreDto> CreateGenreAsync(CreateGenreDto createGenreDto)
        {
            // Check if genre name already exists
            var existingGenre = await _unitOfWork.Genres.FirstOrDefaultAsync(g => g.Name == createGenreDto.Name);
            if (existingGenre != null)
                throw new InvalidOperationException("Bu tür adı zaten mevcut.");

            var genre = _mapper.Map<Genre>(createGenreDto);
            genre.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.Genres.AddAsync(genre);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<GenreDto>(genre);
        }

        public async Task<GenreDto> UpdateGenreAsync(int id, UpdateGenreDto updateGenreDto)
        {
            var genre = await _unitOfWork.Genres.GetByIdAsync(id);
            if (genre == null)
                throw new InvalidOperationException("Tür bulunamadı.");

            // Check if new name already exists (if name is being changed)
            if (!string.IsNullOrEmpty(updateGenreDto.Name) && updateGenreDto.Name != genre.Name)
            {
                var existingGenre = await _unitOfWork.Genres.FirstOrDefaultAsync(g => g.Name == updateGenreDto.Name);
                if (existingGenre != null)
                    throw new InvalidOperationException("Bu tür adı zaten mevcut.");
            }

            _mapper.Map(updateGenreDto, genre);

            _unitOfWork.Genres.Update(genre);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<GenreDto>(genre);
        }

        public async Task DeleteGenreAsync(int id)
        {
            var genre = await _unitOfWork.Genres.GetByIdAsync(id);
            if (genre == null)
                throw new InvalidOperationException("Tür bulunamadı.");

            // Check if genre is used by any games
            var gameCount = await _context.GameGenres.CountAsync(gg => gg.GenreId == id);
            if (gameCount > 0)
                throw new InvalidOperationException("Bu tür oyunlar tarafından kullanılıyor, silinemez.");

            _unitOfWork.Genres.Remove(genre);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> IsGenreNameExistsAsync(string name)
        {
            return await _unitOfWork.Genres.AnyAsync(g => g.Name == name);
        }
    }
}