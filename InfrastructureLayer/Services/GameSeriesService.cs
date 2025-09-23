using AutoMapper;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;

namespace InfrastructureLayer.Services
{
    public class GameSeriesService : IGameSeriesService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GameSeriesService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GameSeriesDto>> GetAllGameSeriesAsync()
        {
            var gameSeries = await _unitOfWork.GameSeries.GetAllWithGameCountAsync();
            var gameSeriesDtos = new List<GameSeriesDto>();

            foreach (var series in gameSeries)
            {
                var gameCount = await _unitOfWork.Games.CountAsync(g => g.GameSeriesId == series.Id);
                var dto = _mapper.Map<GameSeriesDto>(series);
                dto.GameCount = gameCount;
                gameSeriesDtos.Add(dto);
            }

            return gameSeriesDtos;
        }

        public async Task<GameSeriesDto?> GetGameSeriesByIdAsync(int id)
        {
            var gameSeries = await _unitOfWork.GameSeries.GetByIdWithGamesAsync(id);
            if (gameSeries == null)
                return null;

            var dto = _mapper.Map<GameSeriesDto>(gameSeries);
            dto.GameCount = gameSeries.Games.Count;
            return dto;
        }

        public async Task<GameSeriesDto> CreateGameSeriesAsync(CreateGameSeriesDto createDto)
        {
            if (await ExistsByNameAsync(createDto.Name))
                throw new InvalidOperationException($"'{createDto.Name}' adında bir oyun serisi zaten var.");

            var gameSeries = _mapper.Map<GameSeries>(createDto);
            gameSeries.CreatedDate = DateTime.UtcNow;

            await _unitOfWork.GameSeries.AddAsync(gameSeries);
            await _unitOfWork.SaveChangesAsync();

            var dto = _mapper.Map<GameSeriesDto>(gameSeries);
            dto.GameCount = 0;
            return dto;
        }

        public async Task<GameSeriesDto> UpdateGameSeriesAsync(int id, UpdateGameSeriesDto updateDto)
        {
            var gameSeries = await _unitOfWork.GameSeries.GetByIdAsync(id);
            if (gameSeries == null)
                throw new InvalidOperationException("Oyun serisi bulunamadı.");

            // Check name uniqueness if name is being changed
            if (gameSeries.Name != updateDto.Name && await ExistsByNameAsync(updateDto.Name))
                throw new InvalidOperationException($"'{updateDto.Name}' adında bir oyun serisi zaten var.");

            _mapper.Map(updateDto, gameSeries);
            _unitOfWork.GameSeries.Update(gameSeries);
            await _unitOfWork.SaveChangesAsync();

            var gameCount = await _unitOfWork.Games.CountAsync(g => g.GameSeriesId == id);
            var dto = _mapper.Map<GameSeriesDto>(gameSeries);
            dto.GameCount = gameCount;
            return dto;
        }

        public async Task<bool> DeleteGameSeriesAsync(int id)
        {
            var gameSeries = await _unitOfWork.GameSeries.GetByIdAsync(id);
            if (gameSeries == null)
                return false;

            // Check if any games are linked to this series
            var gameCount = await _unitOfWork.Games.CountAsync(g => g.GameSeriesId == id);
            if (gameCount > 0)
                throw new InvalidOperationException($"Bu oyun serisine bağlı {gameCount} oyun var. Önce oyunları başka bir seriye taşıyın veya seriyi kaldırın.");

            _unitOfWork.GameSeries.Remove(gameSeries);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsByNameAsync(string name)
        {
            return await _unitOfWork.GameSeries.ExistsByNameAsync(name);
        }

        public async Task<IEnumerable<GameSeriesDto>> SearchGameSeriesAsync(string searchTerm)
        {
            var allSeries = await GetAllGameSeriesAsync();
            return allSeries.Where(s => 
                s.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                (!string.IsNullOrEmpty(s.Description) && s.Description.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(s.IGDBName) && s.IGDBName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }
    }
}