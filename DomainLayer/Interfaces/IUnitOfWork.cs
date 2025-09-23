using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }
        IGameRepository Games { get; }
        IRepository<Comment> Comments { get; }
        IRepository<Like> Likes { get; }
        IUserGameStatusRepository UserGameStatuses { get; }
        IRepository<Guide> Guides { get; }
        IGuideBlockRepository GuideBlocks { get; }
        IRepository<ForumTopic> ForumTopics { get; }
        IRepository<BlogPost> BlogPosts { get; }
        IGenreRepository Genres { get; }
        ITagRepository Tags { get; }
        IRepository<ForumCategory> ForumCategories { get; }
        IRepository<BlogCategory> BlogCategories { get; }
        IRepository<GuideCategory> GuideCategories { get; }
        IGameRatingRepository GameRatings { get; }
        IPlatformRepository Platforms { get; }
        IGameModeRepository GameModes { get; }
        IThemeRepository Themes { get; }
        IGameSeriesRepository GameSeries { get; }
        IGameMediaRepository GameMedia { get; }
        IGameWebsiteRepository GameWebsites { get; }
        IGamePlatformRepository GamePlatforms { get; }
        IGameGenreRepository GameGenres { get; }
        IGameTagRepository GameTags { get; }
        IGameGameModeRepository GameGameModes { get; }
        IGameThemeRepository GameThemes { get; }
        IRefreshTokenRepository RefreshTokens { get; }
        INotificationRepository Notifications { get; }
        IReportRepository Reports { get; }
        IKeywordRepository Keywords { get; }
        IRepository<Favorite> Favorites { get; }
        
        // Social and Messaging repositories
        IFriendshipRepository Friendships { get; }
        IFollowRepository Follows { get; }
        IConversationRepository Conversations { get; }
        IMessageRepository Messages { get; }

        IRepository<T> Repository<T>() where T : class;
        Task<int> SaveAsync();
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}