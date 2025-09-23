using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text;
using DomainLayer.Interfaces;

namespace InfrastructureLayer.ExternalApiServices
{
    public class TwitchOAuthService : ITwitchOAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TwitchOAuthService> _logger;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private string? _cachedToken;
        private DateTime _tokenExpiry;

        private const string TokenUrl = "https://id.twitch.tv/oauth2/token";
        private const string ValidateUrl = "https://id.twitch.tv/oauth2/validate";

        public TwitchOAuthService(HttpClient httpClient, IConfiguration configuration, ILogger<TwitchOAuthService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            
            _clientId = _configuration["ExternalApis:Twitch:ClientId"] ?? "d8wuap1lihi56acwsqlx1rne8rzajv";
            _clientSecret = _configuration["ExternalApis:Twitch:ClientSecret"] ?? throw new InvalidOperationException("Twitch Client Secret not configured");
        }

        public async Task<string> GetAccessTokenAsync()
        {
            // Return cached token if still valid
            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return _cachedToken;
            }

            try
            {
                var parameters = new Dictionary<string, string>
                {
                    ["client_id"] = _clientId,
                    ["client_secret"] = _clientSecret,
                    ["grant_type"] = "client_credentials"
                };

                var content = new FormUrlEncodedContent(parameters);
                var response = await _httpClient.PostAsync(TokenUrl, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Twitch OAuth token request failed. Status: {StatusCode}, Response: {Response}", 
                        response.StatusCode, errorContent);
                    throw new HttpRequestException($"Twitch OAuth token request failed: {response.StatusCode}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonConvert.DeserializeObject<TwitchTokenResponse>(responseContent);
                
                if (tokenResponse?.AccessToken == null)
                {
                    throw new InvalidOperationException("Invalid token response from Twitch");
                }

                _cachedToken = tokenResponse.AccessToken;
                _tokenExpiry = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn - 300); // 5 minutes buffer
                
                _logger.LogInformation("Successfully obtained Twitch OAuth token");
                return _cachedToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obtaining Twitch OAuth token");
                throw;
            }
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                
                var response = await _httpClient.GetAsync(ValidateUrl);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Twitch token");
                return false;
            }
        }
    }

    public class TwitchTokenResponse
    {
        [JsonProperty("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonProperty("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonProperty("token_type")]
        public string TokenType { get; set; } = string.Empty;
    }
}