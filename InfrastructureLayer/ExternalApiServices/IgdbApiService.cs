using DomainLayer.ExternalApiModels;
using DomainLayer.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text;

namespace InfrastructureLayer.ExternalApiServices
{
    public class IgdbApiService : IIgdbApiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IgdbApiService> _logger;
        private readonly ITwitchOAuthService _twitchOAuthService;
        private readonly string _clientId;
        private const string BaseUrl = "https://api.igdb.com/v4";

        public IgdbApiService(HttpClient httpClient, IConfiguration configuration, ILogger<IgdbApiService> logger, ITwitchOAuthService twitchOAuthService)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _twitchOAuthService = twitchOAuthService;
            
            _clientId = _configuration["ExternalApis:Twitch:ClientId"] ?? "ycjrkfm0s6i0rbt3q5vowdjhr8k9kd";
        }

        private async Task SetupHttpClientAsync()
        {
            var accessToken = await _twitchOAuthService.GetAccessTokenAsync();
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Client-ID", _clientId);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<IEnumerable<IgdbGameModel>> SearchGamesAsync(string searchTerm, int limit = 10)
        {
            try
            {
                await SetupHttpClientAsync();
                
                var query = $@"
                    search ""{searchTerm}"";
                    fields id, name, summary, storyline, first_release_date, category, rating, rating_count, 
                           aggregated_rating, aggregated_rating_count, genres.name, platforms.name, 
                           platforms.abbreviation, screenshots.image_id, cover.image_id, 
                           websites.category, websites.url, involved_companies.company.name, 
                           involved_companies.developer, involved_companies.publisher,
                           release_dates.date, release_dates.platform.name, release_dates.region, release_dates.status;
                    limit {limit};
                ";

                var response = await PostQueryAsync("games", query);
                return JsonConvert.DeserializeObject<List<IgdbGameModel>>(response) ?? new List<IgdbGameModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching games with term: {SearchTerm}", searchTerm);
                throw;
            }
        }

        public async Task<IgdbGameModel?> GetGameByIdAsync(int igdbId)
        {
            try
            {
                await SetupHttpClientAsync();
                var query = $@"
                    fields 
                        id, name, summary, storyline, 
                        first_release_date, category,
                        rating, rating_count, 
                        aggregated_rating, aggregated_rating_count,
                        genres.id, genres.name,
                        themes.id, themes.name,
                        game_modes.id, game_modes.name,
                        player_perspectives.id, player_perspectives.name,
                        platforms.id, platforms.name, platforms.abbreviation,
                        keywords.id, keywords.name,
                        collection.id, collection.name,
                        franchise.id, franchise.name,
                        involved_companies.company.id, involved_companies.company.name, 
                        involved_companies.developer, involved_companies.publisher,
                        websites.category, websites.url,
                        screenshots.id, screenshots.image_id,
                        videos.id, videos.name, videos.video_id,
                        artworks.id, artworks.image_id,
                        cover.id, cover.image_id,
                        language_supports.language.id, language_supports.language.name, 
                        language_supports.language.native_name, language_supports.language.locale,
                        language_supports.language_support_type.id, language_supports.language_support_type.name,
                        release_dates.date, release_dates.platform.name, release_dates.region, release_dates.status,
                        updated_at, slug, url;
                    where id = {igdbId};
                ";

                var response = await PostQueryAsync("games", query);
                var games = JsonConvert.DeserializeObject<List<IgdbGameModel>>(response);
                return games?.FirstOrDefault();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting game by ID: {IgdbId}", igdbId);
                throw;
            }
        }

        public async Task<IEnumerable<IgdbGameModel>> GetPopularGamesAsync(int limit = 20)
        {
            try
            {
                await SetupHttpClientAsync();
                var query = $@"
                    fields id, name, summary, storyline, first_release_date, category, rating, rating_count, 
                           aggregated_rating, aggregated_rating_count, genres.name, platforms.name, 
                           platforms.abbreviation, screenshots.image_id, cover.image_id, 
                           websites.category, websites.url, involved_companies.company.name, 
                           involved_companies.developer, involved_companies.publisher,
                           release_dates.date, release_dates.platform.name, release_dates.region, release_dates.status;
                    where aggregated_rating_count > 10 & aggregated_rating > 75;
                    sort aggregated_rating desc;
                    limit {limit};
                ";

                var response = await PostQueryAsync("games", query);
                return JsonConvert.DeserializeObject<List<IgdbGameModel>>(response) ?? new List<IgdbGameModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular games");
                throw;
            }
        }

        public async Task<IEnumerable<IgdbGameModel>> GetRecentGamesAsync(int limit = 20)
        {
            try
            {
                await SetupHttpClientAsync();
                var currentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var thirtyDaysAgo = DateTimeOffset.UtcNow.AddDays(-30).ToUnixTimeSeconds();

                var query = $@"
                    fields id, name, summary, storyline, first_release_date, category, rating, rating_count, 
                           aggregated_rating, aggregated_rating_count, genres.name, platforms.name, 
                           platforms.abbreviation, screenshots.image_id, cover.image_id, 
                           websites.category, websites.url, involved_companies.company.name, 
                           involved_companies.developer, involved_companies.publisher,
                           release_dates.date, release_dates.platform.name, release_dates.region, release_dates.status;
                    where first_release_date >= {thirtyDaysAgo} & first_release_date <= {currentTimestamp};
                    sort first_release_date desc;
                    limit {limit};
                ";

                var response = await PostQueryAsync("games", query);
                return JsonConvert.DeserializeObject<List<IgdbGameModel>>(response) ?? new List<IgdbGameModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent games");
                throw;
            }
        }

        public async Task<IEnumerable<IgdbGameModel>> GetGamesByGenreAsync(int genreId, int limit = 20)
        {
            try
            {
                await SetupHttpClientAsync();
                var query = $@"
                    fields id, name, summary, storyline, first_release_date, category, rating, rating_count, 
                           aggregated_rating, aggregated_rating_count, genres.name, platforms.name, 
                           platforms.abbreviation, screenshots.image_id, cover.image_id, 
                           websites.category, websites.url, involved_companies.company.name, 
                           involved_companies.developer, involved_companies.publisher,
                           release_dates.date, release_dates.platform.name, release_dates.region, release_dates.status;
                    where genres = [{genreId}];
                    sort aggregated_rating desc;
                    limit {limit};
                ";

                var response = await PostQueryAsync("games", query);
                return JsonConvert.DeserializeObject<List<IgdbGameModel>>(response) ?? new List<IgdbGameModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting games by genre: {GenreId}", genreId);
                throw;
            }
        }

        public async Task<IEnumerable<IgdbGameModel>> GetGamesByPlatformAsync(int platformId, int limit = 20)
        {
            try
            {
                await SetupHttpClientAsync();
                var query = $@"
                    fields id, name, summary, storyline, first_release_date, category, rating, rating_count, 
                           aggregated_rating, aggregated_rating_count, genres.name, platforms.name, 
                           platforms.abbreviation, screenshots.image_id, cover.image_id, 
                           websites.category, websites.url, involved_companies.company.name, 
                           involved_companies.developer, involved_companies.publisher,
                           release_dates.date, release_dates.platform.name, release_dates.region, release_dates.status;
                    where platforms = [{platformId}];
                    sort aggregated_rating desc;
                    limit {limit};
                ";

                var response = await PostQueryAsync("games", query);
                return JsonConvert.DeserializeObject<List<IgdbGameModel>>(response) ?? new List<IgdbGameModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting games by platform: {PlatformId}", platformId);
                throw;
            }
        }

        public async Task<string> GetGenresAsync()
        {
            try
            {
                await SetupHttpClientAsync();
                var query = "fields id, name; limit 500;";
                return await PostQueryAsync("genres", query);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting genres from IGDB");
                throw;
            }
        }

        public async Task<string> GetThemesAsync()
        {
            try
            {
                await SetupHttpClientAsync();
                var query = "fields id, name; limit 500;";
                return await PostQueryAsync("themes", query);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting themes from IGDB");
                throw;
            }
        }

        public async Task<string> GetGameModesAsync()
        {
            try
            {
                await SetupHttpClientAsync();
                var query = "fields id, name; limit 500;";
                return await PostQueryAsync("game_modes", query);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting game modes from IGDB");
                throw;
            }
        }

        public async Task<string> GetPlayerPerspectivesAsync()
        {
            try
            {
                await SetupHttpClientAsync();
                var query = "fields id, name; limit 500;";
                return await PostQueryAsync("player_perspectives", query);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting player perspectives from IGDB");
                throw;
            }
        }

        public async Task<string> GetPlatformsAsync()
        {
            try
            {
                await SetupHttpClientAsync();
                var query = "fields id, name, abbreviation; limit 500;";
                return await PostQueryAsync("platforms", query);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting platforms from IGDB");
                throw;
            }
        }

        public async Task<IgdbTimeToBeat?> GetHowLongToBeatAsync(int gameIgdbId)
        {
            try
            {
                await SetupHttpClientAsync();
                var query = $"fields id, normally, completely, game; where game = {gameIgdbId};";
                var response = await PostQueryAsync("time_to_beats", query);
                var timeToBeatList = JsonConvert.DeserializeObject<List<IgdbTimeToBeat>>(response);
                return timeToBeatList?.FirstOrDefault();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting HowLongToBeat data for game ID: {GameId}", gameIgdbId);
                return null; // Return null instead of throwing to not break game import
            }
        }

        private async Task<string> PostQueryAsync(string endpoint, string query)
        {
            try
            {
                _logger.LogInformation("IGDB API Query: {Query}", query);
                var content = new StringContent(query, Encoding.UTF8, "text/plain");
                var response = await _httpClient.PostAsync($"{BaseUrl}/{endpoint}", content);
                
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("IGDB API Response Status: {StatusCode}, Content: {Content}", 
                    response.StatusCode, responseContent);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("IGDB API request failed. Status: {StatusCode}, Response: {Response}, Query: {Query}", 
                        response.StatusCode, responseContent, query);
                    throw new HttpRequestException($"IGDB API request failed: {response.StatusCode} - {responseContent}");
                }

                return responseContent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in IGDB API request. Query: {Query}", query);
                throw;
            }
        }
    }
}