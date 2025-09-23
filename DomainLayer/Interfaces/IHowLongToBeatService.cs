using DomainLayer.ExternalApiModels;

namespace DomainLayer.Interfaces
{
    public interface IHowLongToBeatService
    {
        Task<HltbGameData?> GetGameDataAsync(string gameTitle);
    }
}