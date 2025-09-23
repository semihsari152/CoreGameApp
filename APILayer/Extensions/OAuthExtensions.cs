using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace APILayer.Extensions;

public static class OAuthExtensions
{
    public static IServiceCollection AddOAuthAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication()
            .AddCookie("Cookies", options =>
            {
                options.LoginPath = "/login";
                options.LogoutPath = "/logout";
                options.ExpireTimeSpan = TimeSpan.FromDays(30);
                options.SlidingExpiration = true;
                options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax;
                options.Cookie.SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.None; // Development only
            })
            .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
            {
                options.ClientId = configuration["GoogleOAuth:ClientId"] ?? throw new ArgumentNullException("GoogleOAuth:ClientId");
                options.ClientSecret = configuration["GoogleOAuth:ClientSecret"] ?? throw new ArgumentNullException("GoogleOAuth:ClientSecret");
                
                // Set callback path
                options.CallbackPath = "/api/oauth/google/callback";
                
                // Use Cookie authentication for sign-in
                options.SignInScheme = "Cookies";
                
                // Disable state validation for development
                options.UsePkce = false;
                options.SaveTokens = true;
                
                // Add necessary scopes
                options.Scope.Add("email");
                options.Scope.Add("profile");
                
                // Map claims
                options.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "sub");
                options.ClaimActions.MapJsonKey(ClaimTypes.Name, "name");
                options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
                options.ClaimActions.MapJsonKey("picture", "picture");
                
                // Custom event to bypass state validation
                options.Events.OnTicketReceived = context =>
                {
                    return Task.CompletedTask;
                };
            })
            .AddOAuth("Discord", "Discord", options =>
            {
                options.ClientId = configuration["DiscordOAuth:ClientId"] ?? throw new ArgumentNullException("DiscordOAuth:ClientId");
                options.ClientSecret = configuration["DiscordOAuth:ClientSecret"] ?? throw new ArgumentNullException("DiscordOAuth:ClientSecret");
                
                // Set callback path
                options.CallbackPath = "/api/oauth/discord/callback";
                
                // Use Cookie authentication for sign-in
                options.SignInScheme = "Cookies";
                
                // Additional options for state bypass
                options.SaveTokens = true;
                
                options.AuthorizationEndpoint = "https://discord.com/api/oauth2/authorize";
                options.TokenEndpoint = "https://discord.com/api/oauth2/token";
                options.UserInformationEndpoint = "https://discord.com/api/users/@me";
                
                options.Scope.Add("identify");
                options.Scope.Add("email");
                
                options.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "id");
                options.ClaimActions.MapJsonKey(ClaimTypes.Name, "username");
                options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
                options.ClaimActions.MapJsonKey("discriminator", "discriminator");
                options.ClaimActions.MapJsonKey("avatar", "avatar");
                
                options.Events = new OAuthEvents
                {
                    OnCreatingTicket = async context =>
                    {
                        var request = new HttpRequestMessage(HttpMethod.Get, context.Options.UserInformationEndpoint);
                        request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", context.AccessToken);

                        var response = await context.Backchannel.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.HttpContext.RequestAborted);
                        response.EnsureSuccessStatusCode();

                        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                        context.RunClaimActions(json.RootElement);
                    },
                    OnTicketReceived = context =>
                    {
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }
}