using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IIgdbGameImportService
    {
        Task<Game> ImportGameByIgdbIdAsync(int igdbId);
    }
}