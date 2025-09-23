using Microsoft.EntityFrameworkCore;
using DomainLayer.Interfaces;
using DomainLayer.Entities;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? _transaction;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
            Users = new UserRepository(_context);
            Games = new GameRepository(_context);
            Comments = new Repository<Comment>(_context);
            Likes = new Repository<Like>(_context);
            UserGameStatuses = new UserGameStatusRepository(_context);
            Guides = new Repository<Guide>(_context);
            ForumTopics = new Repository<ForumTopic>(_context);
            BlogPosts = new Repository<BlogPost>(_context);
            Genres = new GenreRepository(_context);
            Tags = new TagRepository(_context);
            ForumCategories = new Repository<ForumCategory>(_context);
            BlogCategories = new Repository<BlogCategory>(_context);
            GuideCategories = new Repository<GuideCategory>(_context);
            GameRatings = new GameRatingRepository(_context);
            Platforms = new PlatformRepository(_context);
            GameModes = new GameModeRepository(_context);
            Themes = new ThemeRepository(_context);
            GameSeries = new GameSeriesRepository(_context);
            GameMedia = new GameMediaRepository(_context);
            GameWebsites = new GameWebsiteRepository(_context);
            GamePlatforms = new GamePlatformRepository(_context);
            GameGenres = new GameGenreRepository(_context);
            GameTags = new GameTagRepository(_context);
            GameGameModes = new GameGameModeRepository(_context);
            GameThemes = new GameThemeRepository(_context);
            RefreshTokens = new RefreshTokenRepository(_context);
            Notifications = new NotificationRepository(_context);
            Reports = new ReportRepository(_context);
            Keywords = new KeywordRepository(_context);
            GuideBlocks = new GuideBlockRepository(_context);
            Favorites = new Repository<Favorite>(_context);
            
            // Admin Panel repositories
            AdminPermissions = new AdminPermissionRepository(_context);
            UserAdminPermissions = new UserAdminPermissionRepository(_context);
            AuditLogs = new AuditLogRepository(_context);
            
            // Social and Messaging repositories
            Friendships = new FriendshipRepository(_context);
            Follows = new FollowRepository(_context);
            Conversations = new ConversationRepository(_context);
            Messages = new MessageRepository(_context);
        }

        public IUserRepository Users { get; private set; }
        public IGameRepository Games { get; private set; }
        public IRepository<Comment> Comments { get; private set; }
        public IRepository<Like> Likes { get; private set; }
        public IUserGameStatusRepository UserGameStatuses { get; private set; }
        public IRepository<Guide> Guides { get; private set; }
        public IGuideBlockRepository GuideBlocks { get; private set; }
        public IRepository<ForumTopic> ForumTopics { get; private set; }
        public IRepository<BlogPost> BlogPosts { get; private set; }
        public IGenreRepository Genres { get; private set; }
        public ITagRepository Tags { get; private set; }
        public IRepository<ForumCategory> ForumCategories { get; private set; }
        public IRepository<BlogCategory> BlogCategories { get; private set; }
        public IRepository<GuideCategory> GuideCategories { get; private set; }
        public IGameRatingRepository GameRatings { get; private set; }
        public IPlatformRepository Platforms { get; private set; }
        public IGameModeRepository GameModes { get; private set; }
        public IThemeRepository Themes { get; private set; }
        public IGameSeriesRepository GameSeries { get; private set; }
        public IGameMediaRepository GameMedia { get; private set; }
        public IGameWebsiteRepository GameWebsites { get; private set; }
        public IGamePlatformRepository GamePlatforms { get; private set; }
        public IGameGenreRepository GameGenres { get; private set; }
        public IGameTagRepository GameTags { get; private set; }
        public IGameGameModeRepository GameGameModes { get; private set; }
        public IGameThemeRepository GameThemes { get; private set; }
        public IRefreshTokenRepository RefreshTokens { get; private set; }
        public INotificationRepository Notifications { get; private set; }
        public IReportRepository Reports { get; private set; }
        public IKeywordRepository Keywords { get; private set; }
        public IRepository<Favorite> Favorites { get; private set; }
        
        // Admin Panel repositories
        public AdminPermissionRepository AdminPermissions { get; private set; }
        public UserAdminPermissionRepository UserAdminPermissions { get; private set; }
        public AuditLogRepository AuditLogs { get; private set; }
        
        // Social and Messaging repositories
        public IFriendshipRepository Friendships { get; private set; }
        public IFollowRepository Follows { get; private set; }
        public IConversationRepository Conversations { get; private set; }
        public IMessageRepository Messages { get; private set; }

        public IRepository<T> Repository<T>() where T : class
        {
            return new Repository<T>(_context);
        }

        public async Task<int> SaveAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}