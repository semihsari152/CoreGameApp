using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using DomainLayer.Interfaces;
using DomainLayer.Entities;
using DomainLayer.Enums;
using ApplicationLayer.Services;
using ApplicationLayer.DTOs;
using System.Security.Claims;

namespace APILayer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OAuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<OAuthController> _logger;

    public OAuthController(
        IUserRepository userRepository,
        IUserService userService,
        ITokenService tokenService,
        IUnitOfWork unitOfWork,
        ILogger<OAuthController> logger)
    {
        _userRepository = userRepository;
        _userService = userService;
        _tokenService = tokenService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpGet("google/signin")]
    public IActionResult GoogleSignIn(string returnUrl = "/")
    {
        var clientId = "780086712327-vgb6j4g1t4s1cfqvpl70856n9ki1i3gg.apps.googleusercontent.com";
        var redirectUri = "http://localhost:5124/api/oauth/google/callback";
        var scope = "openid email profile";
        
        var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
                     $"client_id={clientId}&" +
                     $"response_type=code&" +
                     $"scope={Uri.EscapeDataString(scope)}&" +
                     $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
                     $"access_type=offline";
        
        return Redirect(authUrl);
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback(string code, string error = null)
    {
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogError("Google OAuth error: {Error}", error);
            return Redirect("http://localhost:3001/login?error=oauth_failed");
        }

        if (string.IsNullOrEmpty(code))
        {
            _logger.LogError("No authorization code received from Google");
            return Redirect("http://localhost:3001/login?error=oauth_failed");
        }

        try
        {
            // Exchange code for tokens
            var httpClient = new HttpClient();
            var tokenRequest = new Dictionary<string, string>
            {
                ["client_id"] = "780086712327-vgb6j4g1t4s1cfqvpl70856n9ki1i3gg.apps.googleusercontent.com",
                ["client_secret"] = "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",
                ["code"] = code,
                ["grant_type"] = "authorization_code",
                ["redirect_uri"] = "http://localhost:5124/api/oauth/google/callback"
            };

            var tokenResponse = await httpClient.PostAsync("https://oauth2.googleapis.com/token",
                new FormUrlEncodedContent(tokenRequest));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to exchange code for tokens: {StatusCode}", tokenResponse.StatusCode);
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            var tokenData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(tokenJson);
            
            if (!tokenData.TryGetValue("access_token", out var accessTokenObj))
            {
                _logger.LogError("No access token in response");
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var accessToken = accessTokenObj.ToString();

            // Get user info
            httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            var userInfoResponse = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
            if (!userInfoResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to get user info from Google");
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
            var userInfo = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(userInfoJson);

            var email = userInfo.GetValueOrDefault("email")?.ToString();
            var name = userInfo.GetValueOrDefault("name")?.ToString();
            var googleId = userInfo.GetValueOrDefault("id")?.ToString();
            var picture = userInfo.GetValueOrDefault("picture")?.ToString();

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(googleId))
            {
                _logger.LogError("Required user information missing from Google");
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var (user, isNewUser) = await GetOrCreateUser(email, name, googleId, picture, "Google");
            var authResponse = await _tokenService.GenerateTokensAsync(user);
            var token = authResponse.AccessToken;

            _logger.LogInformation("Google OAuth: User {Email}, IsNewUser: {IsNewUser}", email, isNewUser);

            // Redirect to frontend with token and new user flag
            var redirectUrl = $"http://localhost:3001/oauth/callback?token={token}&provider=google&isNewUser={isNewUser}";
            _logger.LogInformation("Google OAuth redirect URL: {RedirectUrl}", redirectUrl);
            
            return Redirect(redirectUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google OAuth callback");
            return Redirect("http://localhost:3001/login?error=oauth_failed");
        }
    }

    [HttpGet("discord/signin")]
    public IActionResult DiscordSignIn(string returnUrl = "/")
    {
        var clientId = "1407316040215564369";
        var redirectUri = "http://localhost:5124/api/oauth/discord/callback";
        var scope = "identify email";
        
        var authUrl = $"https://discord.com/api/oauth2/authorize?" +
                     $"client_id={clientId}&" +
                     $"response_type=code&" +
                     $"scope={Uri.EscapeDataString(scope)}&" +
                     $"redirect_uri={Uri.EscapeDataString(redirectUri)}";
        
        return Redirect(authUrl);
    }

    [HttpGet("discord/callback")]
    public async Task<IActionResult> DiscordCallback(string code, string error = null)
    {
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogError("Discord OAuth error: {Error}", error);
            return Redirect("http://localhost:3001/login?error=oauth_failed");
        }

        if (string.IsNullOrEmpty(code))
        {
            _logger.LogError("No authorization code received from Discord");
            return Redirect("http://localhost:3001/login?error=oauth_failed");
        }

        try
        {
            // Exchange code for tokens
            var httpClient = new HttpClient();
            var tokenRequest = new Dictionary<string, string>
            {
                ["client_id"] = "1407316040215564369",
                ["client_secret"] = "ebkpYo8vGpg8zHtwgJVmi6vfuAjD0GjV",
                ["code"] = code,
                ["grant_type"] = "authorization_code",
                ["redirect_uri"] = "http://localhost:5124/api/oauth/discord/callback"
            };

            var tokenResponse = await httpClient.PostAsync("https://discord.com/api/oauth2/token",
                new FormUrlEncodedContent(tokenRequest));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to exchange code for tokens: {StatusCode}", tokenResponse.StatusCode);
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            var tokenData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(tokenJson);
            
            if (!tokenData.TryGetValue("access_token", out var accessTokenObj))
            {
                _logger.LogError("No access token in response");
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var accessToken = accessTokenObj.ToString();

            // Get user info
            httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            var userInfoResponse = await httpClient.GetAsync("https://discord.com/api/users/@me");
            if (!userInfoResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to get user info from Discord");
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
            var userInfo = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(userInfoJson);

            var email = userInfo.GetValueOrDefault("email")?.ToString();
            var username = userInfo.GetValueOrDefault("username")?.ToString();
            var discordId = userInfo.GetValueOrDefault("id")?.ToString();
            var discriminator = userInfo.GetValueOrDefault("discriminator")?.ToString();
            var avatar = userInfo.GetValueOrDefault("avatar")?.ToString();

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(discordId))
            {
                _logger.LogError("Required user information missing from Discord");
                return Redirect("http://localhost:3001/login?error=oauth_failed");
            }

            var displayName = string.IsNullOrEmpty(discriminator) ? username : $"{username}#{discriminator}";
            var avatarUrl = !string.IsNullOrEmpty(avatar) 
                ? $"https://cdn.discordapp.com/avatars/{discordId}/{avatar}.png"
                : null;

            var (user, isNewUser) = await GetOrCreateUser(email, displayName, discordId, avatarUrl, "Discord");
            var authResponse = await _tokenService.GenerateTokensAsync(user);
            var token = authResponse.AccessToken;

            _logger.LogInformation("Discord OAuth: User {Email}, IsNewUser: {IsNewUser}", email, isNewUser);

            // Redirect to frontend with token and new user flag
            var redirectUrl = $"http://localhost:3001/oauth/callback?token={token}&provider=discord&isNewUser={isNewUser}";
            _logger.LogInformation("Discord OAuth redirect URL: {RedirectUrl}", redirectUrl);
            
            return Redirect(redirectUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Discord OAuth callback");
            return Redirect("http://localhost:3001/login?error=oauth_failed");
        }
    }

    private async Task<(UserDto user, bool isNewUser)> GetOrCreateUser(string email, string? name, string providerId, string? avatarUrl, string provider)
    {
        // Check if user exists by email
        var existingUser = await _userService.GetUserByEmailAsync(email);
        
        if (existingUser != null)
        {
            // Update avatar URL if it exists and user doesn't have one
            if (!string.IsNullOrEmpty(avatarUrl) && string.IsNullOrEmpty(existingUser.AvatarUrl))
            {
                // TODO: Update user avatar URL in database
                // For now, just return existing user
            }
            
            // Update last login date
            // Note: We'd need an update method for this, for now just return the user
            return (existingUser, false);
        }

        // Create new user
        var nameParts = name?.Split(' ') ?? new[] { email.Split('@')[0] };
        var firstName = nameParts[0];
        var lastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "";

        // Create user manually to set IsNewUser = true
        var user = new User
        {
            Email = email,
            Username = GenerateUniqueUsername(firstName.ToLower()),
            FirstName = firstName,
            LastName = lastName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password for OAuth users
            CreatedDate = DateTime.UtcNow,
            LastLoginDate = DateTime.UtcNow,
            AvatarUrl = avatarUrl,
            IsNewUser = true, // This is the key difference
            // Privacy settings default to true for new users
            IsActivityStatusVisible = true,
            IsGameListVisible = true,
            IsProfileVisible = true
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            Level = user.Level,
            XP = user.XP,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio,
            IsEmailVerified = user.IsEmailVerified,
            IsActive = user.IsActive,
            IsNewUser = user.IsNewUser,
            CreatedAt = user.CreatedDate,
            LastLoginAt = user.LastLoginDate,
            // Privacy settings
            IsActivityStatusVisible = user.IsActivityStatusVisible,
            IsGameListVisible = user.IsGameListVisible,
            IsProfileVisible = user.IsProfileVisible
        };
        
        return (userDto, true);
    }

    private string GenerateUniqueUsername(string baseName)
    {
        var random = new Random();
        return $"{baseName}_{random.Next(1000, 9999)}";
    }
}