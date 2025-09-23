using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using FluentValidation;
using InfrastructureLayer.Data;
using InfrastructureLayer.Repositories;
using InfrastructureLayer.Services;
using InfrastructureLayer.ExternalApiServices;
using InfrastructureLayer.Middleware;
using DomainLayer.Interfaces;
using ApplicationLayer.Services;
using ApplicationLayer.DTOs;
using ApplicationLayer.Validators;
using ApplicationLayer.Mappings;
using APILayer.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.WriteIndented = true;
});
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo 
    { 
        Title = "CoreGameApp API", 
        Version = "v1" 
    });
    
    // JWT Authorization için
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Database configuration
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Repository pattern
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IGuideRepository, GuideRepository>();
builder.Services.AddScoped<IForumTopicRepository, ForumTopicRepository>();
builder.Services.AddScoped<IBlogPostRepository, BlogPostRepository>();
builder.Services.AddScoped<ILikeRepository, LikeRepository>();
builder.Services.AddScoped<IForumCategoryRepository, ForumCategoryRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserGameStatusRepository, UserGameStatusRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IGamePlatformRepository, GamePlatformRepository>();
builder.Services.AddScoped<IGameRatingRepository, GameRatingRepository>();
builder.Services.AddScoped<IGameSeriesRepository, GameSeriesRepository>();
builder.Services.AddScoped<IGameMediaRepository, GameMediaRepository>();
builder.Services.AddScoped<IGameWebsiteRepository, GameWebsiteRepository>();
builder.Services.AddScoped<IGameGameModeRepository, GameGameModeRepository>();
builder.Services.AddScoped<IGameThemeRepository, GameThemeRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddScoped<IGameTagRepository, GameTagRepository>();
builder.Services.AddScoped<IGameGenreRepository, GameGenreRepository>();
builder.Services.AddScoped<IThemeRepository, ThemeRepository>();
builder.Services.AddScoped<IGenreRepository, GenreRepository>();
builder.Services.AddScoped<IGameModeRepository, GameModeRepository>();
builder.Services.AddScoped<IPlatformRepository, PlatformRepository>();
builder.Services.AddScoped<IKeywordRepository, KeywordRepository>();
builder.Services.AddScoped<IGuideBlockRepository, GuideBlockRepository>();
builder.Services.AddScoped<IGameRepository, GameRepository>();
builder.Services.AddScoped<FavoriteRepository>();

// Social and Messaging repositories
builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();
builder.Services.AddScoped<IFollowRepository, FollowRepository>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

// Admin Panel repositories
builder.Services.AddScoped<AdminPermissionRepository>();
builder.Services.AddScoped<UserAdminPermissionRepository>();
builder.Services.AddScoped<AuditLogRepository>();

// Application Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IGuideService, GuideService>();
builder.Services.AddScoped<IForumTopicService, ForumTopicService>();
builder.Services.AddScoped<IBlogPostService, BlogPostService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IUserGameStatusService, UserGameStatusService>();
builder.Services.AddScoped<IGameRatingService, GameRatingService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IGenreService, GenreService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IForumCategoryService, ForumCategoryService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IGameSeriesService, GameSeriesService>();
builder.Services.AddScoped<ISignalRNotificationService, APILayer.Services.SignalRNotificationService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IGameDataSyncService, GameDataSyncService>();
builder.Services.AddScoped<IGameRelationSyncService, GameRelationSyncService>();

// Admin Panel services
builder.Services.AddScoped<AdminPermissionService>(serviceProvider =>
{
    var adminPermissionRepo = serviceProvider.GetRequiredService<AdminPermissionRepository>();
    var userAdminPermissionRepo = serviceProvider.GetRequiredService<UserAdminPermissionRepository>();
    var userRepo = serviceProvider.GetRequiredService<IUserRepository>();
    var auditLogService = serviceProvider.GetRequiredService<AuditLogService>();
    var context = serviceProvider.GetRequiredService<AppDbContext>();
    
    return new AdminPermissionService(adminPermissionRepo, userAdminPermissionRepo, userRepo, auditLogService, context);
});
builder.Services.AddScoped<AuditLogService>();

// External API Services
builder.Services.AddHttpClient<DomainLayer.Interfaces.ITwitchOAuthService, TwitchOAuthService>();
builder.Services.AddHttpClient<IIgdbApiService, IgdbApiService>();
builder.Services.AddHttpClient<IHowLongToBeatService, HowLongToBeatService>();
builder.Services.AddScoped<IIgdbGameImportService, IgdbGameImportService>();
builder.Services.AddScoped<IStaticDataService, StaticDataService>();

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // For debugging
});

// Infrastructure Services
builder.Services.AddHttpContextAccessor();

// Validators
builder.Services.AddScoped<IValidator<CreateUserDto>, CreateUserValidator>();
builder.Services.AddScoped<IValidator<CreateCommentDto>, CreateCommentValidator>();
builder.Services.AddScoped<IValidator<CreateUserGameStatusDto>, CreateUserGameStatusValidator>();

// JWT Authentication
// Clear default claim mappings to avoid conflicts
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
        var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.Zero // Remove default 5 minute clock skew
        };
        
        // Add detailed event logging for debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception}");
                
                // Handle expired token specifically
                if (context.Exception is SecurityTokenExpiredException)
                {
                    context.Response.StatusCode = 401;
                    context.Response.Headers.Add("Token-Expired", "true");
                    context.Response.Headers.Add("Access-Control-Expose-Headers", "Token-Expired");
                }
                
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("Token validated successfully");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                // SignalR için token'ı query string'den al
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && 
                    (path.StartsWithSegments("/notificationHub") || path.StartsWithSegments("/api/notificationHub") ||
                     path.StartsWithSegments("/chatHub") || path.StartsWithSegments("/api/chatHub")))
                {
                    context.Token = accessToken;
                }
                else if (context.Token != null)
                {
                    Console.WriteLine($"Token received: {context.Token.Substring(0, Math.Min(50, context.Token.Length))}...");
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                // Custom challenge response for expired tokens
                if (context.AuthenticateFailure is SecurityTokenExpiredException)
                {
                    context.HandleResponse();
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    
                    var response = new
                    {
                        message = "Token expired. Please login again.",
                        statusCode = 401,
                        tokenExpired = true,
                        timestamp = DateTime.UtcNow
                    };
                    
                    return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
                }
                
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// OAuth Authentication - Removed to avoid conflict with manual OAuth implementation in OAuthController
// builder.Services.AddOAuthAuthentication(builder.Configuration);

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials(); // SignalR için gerekli
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "CoreGameApp API V1");
    });
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Add global exception middleware
app.UseGlobalExceptionHandling();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Admin Permission Middleware (JWT authentication'dan sonra çalışmalı)
app.UseAdminPermissions();

app.MapControllers();

// SignalR Hub mapping
app.MapHub<APILayer.Hubs.NotificationHub>("/notificationHub");
app.MapHub<APILayer.Hubs.NotificationHub>("/api/notificationHub"); // Add API route for frontend compatibility
app.MapHub<APILayer.Hubs.ChatHub>("/chatHub");
app.MapHub<APILayer.Hubs.ChatHub>("/api/chatHub"); // Add API route for frontend compatibility

// Seed test data in development
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await InfrastructureLayer.Data.DataSeeder.SeedTestDataAsync(context);
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }
}

app.Run();
