using DomainLayer.ExternalApiModels;
using DomainLayer.Interfaces;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Web;

namespace InfrastructureLayer.ExternalApiServices
{
    public class HowLongToBeatService : IHowLongToBeatService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HowLongToBeatService> _logger;
        private const string BaseUrl = "https://hltb-proxy.fly.dev/v1";

        public HowLongToBeatService(HttpClient httpClient, ILogger<HowLongToBeatService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<HltbGameData?> GetGameDataAsync(string gameTitle)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(gameTitle))
                {
                    return null;
                }

                // Clean and encode the game title
                var encodedTitle = HttpUtility.UrlEncode(gameTitle.Trim());
                var url = $"{BaseUrl}/query?title={encodedTitle}";

                _logger.LogInformation("Fetching HLTB data for game: {GameTitle}", gameTitle);

                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("HLTB API request failed for game {GameTitle}. Status: {StatusCode}", 
                        gameTitle, response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(content) || content == "[]")
                {
                    _logger.LogInformation("No HLTB data found for game: {GameTitle}", gameTitle);
                    return null;
                }

                var games = JsonConvert.DeserializeObject<List<HltbGameData>>(content);
                if (games?.Any() == true)
                {
                    // Return the first exact match or closest match
                    var exactMatch = games.FirstOrDefault(g => 
                        string.Equals(g.GameName, gameTitle, StringComparison.OrdinalIgnoreCase));
                    
                    if (exactMatch != null)
                    {
                        _logger.LogInformation("Found exact HLTB match for {GameTitle}: Main={MainHours}h, Completion={CompletionHours}h", 
                            gameTitle, exactMatch.MainStoryHours, exactMatch.CompletionistHours);
                        return exactMatch;
                    }

                    // If no exact match, return the first result
                    var firstResult = games.First();
                    _logger.LogInformation("Found approximate HLTB match for {GameTitle}: {FoundName}, Main={MainHours}h, Completion={CompletionHours}h", 
                        gameTitle, firstResult.GameName, firstResult.MainStoryHours, firstResult.CompletionistHours);
                    return firstResult;
                }

                _logger.LogInformation("No HLTB results found for game: {GameTitle}", gameTitle);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching HLTB data for game: {GameTitle}", gameTitle);
                return null;
            }
        }
    }
}