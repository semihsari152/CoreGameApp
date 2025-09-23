namespace DomainLayer.Interfaces
{
    public interface IStaticDataService
    {
        Task PopulateAllStaticDataAsync();
        Task PopulateGenresAsync();
        Task PopulateThemesAsync();
        Task PopulateGameModesAsync();
        Task PopulatePlayerPerspectivesAsync();
        Task PopulatePlatformsAsync();
    }
}