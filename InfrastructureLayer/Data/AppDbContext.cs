using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Enums;

namespace InfrastructureLayer.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Game> Games { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;
        public DbSet<Like> Likes { get; set; } = null!;
        public DbSet<UserGameStatus> UserGameStatuses { get; set; } = null!;
        public DbSet<Favorite> Favorites { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<Report> Reports { get; set; } = null!;
        public DbSet<Guide> Guides { get; set; } = null!;
        public DbSet<GuideBlock> GuideBlocks { get; set; } = null!;
        public DbSet<ForumTopic> ForumTopics { get; set; } = null!;
        public DbSet<ForumCategory> ForumCategories { get; set; } = null!;
        public DbSet<BlogPost> BlogPosts { get; set; } = null!;
        public DbSet<BlogCategory> BlogCategories { get; set; } = null!;
        public DbSet<Genre> Genres { get; set; } = null!;
        public DbSet<Tag> Tags { get; set; } = null!;
        public DbSet<GameRating> GameRatings { get; set; } = null!;
        public DbSet<DomainLayer.Entities.Platform> Platforms { get; set; } = null!;
        public DbSet<GameMode> GameModes { get; set; } = null!;
        public DbSet<Theme> Themes { get; set; } = null!;
        public DbSet<GameSeries> GameSeries { get; set; } = null!;
        public DbSet<GameMedia> GameMedia { get; set; } = null!;
        public DbSet<GameWebsite> GameWebsites { get; set; } = null!;
        public DbSet<GamePlatform> GamePlatforms { get; set; } = null!;
        public DbSet<GameGenre> GameGenres { get; set; } = null!;
        public DbSet<GameTag> GameTags { get; set; } = null!;
        public DbSet<GameGameMode> GameGameModes { get; set; } = null!;
        public DbSet<GameTheme> GameThemes { get; set; } = null!;
        public DbSet<GuideCategory> GuideCategories { get; set; } = null!;
        public DbSet<GuideTag> GuideTags { get; set; } = null!;
        public DbSet<ForumTopicTag> ForumTopicTags { get; set; } = null!;
        public DbSet<BlogPostTag> BlogPostTags { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<Keyword> Keywords { get; set; } = null!;
        public DbSet<GameKeyword> GameKeywords { get; set; } = null!;
        public DbSet<PlayerPerspective> PlayerPerspectives { get; set; } = null!;
        public DbSet<GamePlayerPerspective> GamePlayerPerspectives { get; set; } = null!;
        
        // Admin Panel entities
        public DbSet<AdminPermission> AdminPermissions { get; set; } = null!;
        public DbSet<UserAdminPermission> UserAdminPermissions { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        
        // New entities
        public DbSet<Company> Companies { get; set; } = null!;
        public DbSet<GameCompany> GameCompanies { get; set; } = null!;
        public DbSet<GameBeatTime> GameBeatTimes { get; set; } = null!;
        public DbSet<GameIgdbRating> GameIgdbRatings { get; set; } = null!;
        
        // Social and Messaging entities
        public DbSet<Friendship> Friendships { get; set; } = null!;
        public DbSet<Follow> Follows { get; set; } = null!;
        public DbSet<Conversation> Conversations { get; set; } = null!;
        public DbSet<ConversationParticipant> ConversationParticipants { get; set; } = null!;
        public DbSet<Message> Messages { get; set; } = null!;
        public DbSet<MessageRead> MessageReads { get; set; } = null!;
        public DbSet<MessageReaction> MessageReactions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configurations
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.Role).HasConversion<int>();
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();
            });

            // Game configurations
            modelBuilder.Entity<Game>(entity =>
            {
                entity.HasKey(g => g.Id);
                entity.Property(g => g.Name).IsRequired().HasMaxLength(200);
                entity.Property(g => g.Slug).HasMaxLength(300);
                entity.HasOne(g => g.GameSeries).WithMany(gs => gs.Games).HasForeignKey(g => g.GameSeriesId);
                entity.HasIndex(g => g.Name);
                entity.HasIndex(g => g.Slug).IsUnique();
                entity.HasIndex(g => g.IGDBId).IsUnique();
            });

            // Comment configurations
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Content).IsRequired();
                entity.Property(c => c.CommentableType).HasConversion<int>();
                entity.HasOne(c => c.User).WithMany(u => u.Comments).HasForeignKey(c => c.UserId);
                entity.HasOne(c => c.ParentComment).WithMany(c => c.ChildComments).HasForeignKey(c => c.ParentCommentId);
                entity.HasIndex(c => new { c.CommentableType, c.TargetEntityId });
            });

            // Like configurations
            modelBuilder.Entity<Like>(entity =>
            {
                entity.HasKey(l => l.Id);
                entity.Property(l => l.LikableType).HasConversion<int>();
                entity.HasOne(l => l.User).WithMany(u => u.Likes).HasForeignKey(l => l.UserId);
                entity.HasIndex(l => new { l.UserId, l.LikableType, l.TargetEntityId }).IsUnique();
            });

            // UserGameStatus configurations
            modelBuilder.Entity<UserGameStatus>(entity =>
            {
                entity.HasKey(ugs => ugs.Id);
                entity.Property(ugs => ugs.Status).HasConversion<int>();
                entity.HasOne(ugs => ugs.User).WithMany(u => u.UserGameStatuses).HasForeignKey(ugs => ugs.UserId);
                entity.HasOne(ugs => ugs.Game).WithMany(g => g.UserGameStatuses).HasForeignKey(ugs => ugs.GameId);
                entity.HasIndex(ugs => new { ugs.UserId, ugs.GameId }).IsUnique();
            });

            // Guide configurations removed - see updated version below

            // ForumTopic configurations
            modelBuilder.Entity<ForumTopic>(entity =>
            {
                entity.HasKey(ft => ft.Id);
                entity.Property(ft => ft.Title).IsRequired().HasMaxLength(200);
                entity.Property(ft => ft.Content).IsRequired();
                entity.HasOne(ft => ft.User).WithMany(u => u.ForumTopics).HasForeignKey(ft => ft.UserId);
                entity.HasOne(ft => ft.ForumCategory).WithMany(fc => fc.ForumTopics).HasForeignKey(ft => ft.ForumCategoryId);
                entity.HasOne(ft => ft.Game).WithMany().HasForeignKey(ft => ft.GameId).OnDelete(DeleteBehavior.SetNull);
            });

            // ForumCategory configurations
            modelBuilder.Entity<ForumCategory>(entity =>
            {
                entity.HasKey(fc => fc.Id);
                entity.Property(fc => fc.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(fc => fc.Name).IsUnique();
            });

            // BlogPost configurations
            modelBuilder.Entity<BlogPost>(entity =>
            {
                entity.HasKey(bp => bp.Id);
                entity.Property(bp => bp.Title).IsRequired().HasMaxLength(200);
                entity.Property(bp => bp.Content).IsRequired();
                entity.HasOne(bp => bp.User).WithMany(u => u.BlogPosts).HasForeignKey(bp => bp.UserId);
                entity.HasOne(bp => bp.Category).WithMany(c => c.BlogPosts).HasForeignKey(bp => bp.CategoryId).OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(bp => bp.Game).WithMany().HasForeignKey(bp => bp.GameId).OnDelete(DeleteBehavior.SetNull);
            });

            // BlogCategory configurations
            modelBuilder.Entity<BlogCategory>(entity =>
            {
                entity.HasKey(bc => bc.Id);
                entity.Property(bc => bc.Name).IsRequired().HasMaxLength(100);
                entity.Property(bc => bc.Description).HasMaxLength(500);
                entity.Property(bc => bc.Color).HasMaxLength(7); // For hex colors like #FF5733
                entity.HasIndex(bc => bc.Name).IsUnique();
            });

            // Genre configurations
            modelBuilder.Entity<Genre>(entity =>
            {
                entity.HasKey(g => g.Id);
                entity.Property(g => g.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(g => g.Name).IsUnique();
            });

            // Tag configurations
            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Name).IsRequired().HasMaxLength(50);
                entity.HasIndex(t => t.Name).IsUnique();
            });

            // GameRating configurations
            modelBuilder.Entity<GameRating>(entity =>
            {
                entity.HasKey(gr => gr.Id);
                entity.Property(gr => gr.Rating).IsRequired();
                entity.HasOne(gr => gr.Game).WithMany(g => g.GameRatings).HasForeignKey(gr => gr.GameId);
                entity.HasOne(gr => gr.User).WithMany().HasForeignKey(gr => gr.UserId);
                entity.HasIndex(gr => new { gr.GameId, gr.UserId }).IsUnique();
            });

            // Platform configurations
            modelBuilder.Entity<DomainLayer.Entities.Platform>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(p => p.Name).IsUnique();
                entity.HasIndex(p => p.IGDBId).IsUnique();
            });

            // GameMode configurations
            modelBuilder.Entity<GameMode>(entity =>
            {
                entity.HasKey(gm => gm.Id);
                entity.Property(gm => gm.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(gm => gm.Name).IsUnique();
                entity.HasIndex(gm => gm.IGDBId).IsUnique();
            });

            // Theme configurations
            modelBuilder.Entity<Theme>(entity =>
            {
                entity.HasKey(t => t.Id);
                entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(t => t.Name).IsUnique();
                entity.HasIndex(t => t.IGDBId).IsUnique();
            });

            // GameSeries configurations
            modelBuilder.Entity<GameSeries>(entity =>
            {
                entity.HasKey(gs => gs.Id);
                entity.Property(gs => gs.Name).IsRequired().HasMaxLength(200);
                entity.HasIndex(gs => gs.Name).IsUnique();
                entity.HasIndex(gs => gs.IGDBId).IsUnique();
            });

            // GameMedia configurations
            modelBuilder.Entity<GameMedia>(entity =>
            {
                entity.HasKey(gm => gm.Id);
                entity.Property(gm => gm.MediaType).HasConversion<int>();
                entity.Property(gm => gm.Url).IsRequired().HasMaxLength(500);
                entity.HasOne(gm => gm.Game).WithMany(g => g.GameMedia).HasForeignKey(gm => gm.GameId);
                entity.HasIndex(gm => new { gm.GameId, gm.MediaType });
            });

            // GameWebsite configurations
            modelBuilder.Entity<GameWebsite>(entity =>
            {
                entity.HasKey(gw => gw.Id);
                entity.Property(gw => gw.WebsiteType).HasConversion<int>();
                entity.Property(gw => gw.Url).IsRequired().HasMaxLength(500);
                entity.HasOne(gw => gw.Game).WithMany(g => g.GameWebsites).HasForeignKey(gw => gw.GameId);
                entity.HasIndex(gw => new { gw.GameId, gw.WebsiteType });
            });


            // Junction table configurations
            modelBuilder.Entity<GamePlatform>(entity =>
            {
                entity.HasKey(gp => gp.Id);
                entity.HasOne(gp => gp.Game).WithMany(g => g.GamePlatforms).HasForeignKey(gp => gp.GameId);
                entity.HasOne(gp => gp.Platform).WithMany(p => p.GamePlatforms).HasForeignKey(gp => gp.PlatformId);
                entity.HasIndex(gp => new { gp.GameId, gp.PlatformId }).IsUnique();
            });

            modelBuilder.Entity<GameGenre>(entity =>
            {
                entity.HasKey(gg => gg.Id);
                entity.HasOne(gg => gg.Game).WithMany(g => g.GameGenres).HasForeignKey(gg => gg.GameId);
                entity.HasOne(gg => gg.Genre).WithMany(g => g.GameGenres).HasForeignKey(gg => gg.GenreId);
                entity.HasIndex(gg => new { gg.GameId, gg.GenreId }).IsUnique();
            });

            modelBuilder.Entity<GameTag>(entity =>
            {
                entity.HasKey(gt => gt.Id);
                entity.HasOne(gt => gt.Game).WithMany().HasForeignKey(gt => gt.GameId);
                entity.HasOne(gt => gt.Tag).WithMany(t => t.GameTags).HasForeignKey(gt => gt.TagId);
                entity.HasIndex(gt => new { gt.GameId, gt.TagId }).IsUnique();
            });

            modelBuilder.Entity<GameGameMode>(entity =>
            {
                entity.HasKey(ggm => ggm.Id);
                entity.HasOne(ggm => ggm.Game).WithMany(g => g.GameGameModes).HasForeignKey(ggm => ggm.GameId);
                entity.HasOne(ggm => ggm.GameMode).WithMany(gm => gm.GameGameModes).HasForeignKey(ggm => ggm.GameModeId);
                entity.HasIndex(ggm => new { ggm.GameId, ggm.GameModeId }).IsUnique();
            });

            modelBuilder.Entity<GameTheme>(entity =>
            {
                entity.HasKey(gt => gt.Id);
                entity.HasOne(gt => gt.Game).WithMany(g => g.GameThemes).HasForeignKey(gt => gt.GameId);
                entity.HasOne(gt => gt.Theme).WithMany(t => t.GameThemes).HasForeignKey(gt => gt.ThemeId);
                entity.HasIndex(gt => new { gt.GameId, gt.ThemeId }).IsUnique();
            });

            // GuideCategory configurations (redesigned)
            modelBuilder.Entity<GuideCategory>(entity =>
            {
                entity.HasKey(gc => gc.Id);
                entity.Property(gc => gc.Name).IsRequired().HasMaxLength(100);
                entity.Property(gc => gc.Description).HasMaxLength(500);
                entity.Property(gc => gc.IconClass).HasMaxLength(100);
                entity.Property(gc => gc.Order).HasDefaultValue(0);
                entity.HasIndex(gc => gc.Name).IsUnique();
                entity.HasIndex(gc => gc.Order);
            });

            // GuideTag configurations
            modelBuilder.Entity<GuideTag>(entity =>
            {
                entity.HasKey(gt => gt.Id);
                entity.HasOne(gt => gt.Guide).WithMany(g => g.GuideTags).HasForeignKey(gt => gt.GuideId);
                entity.HasOne(gt => gt.Tag).WithMany(t => t.GuideTags).HasForeignKey(gt => gt.TagId);
                entity.HasIndex(gt => new { gt.GuideId, gt.TagId }).IsUnique();
            });

            modelBuilder.Entity<ForumTopicTag>(entity =>
            {
                entity.HasKey(ftt => ftt.Id);
                entity.HasOne(ftt => ftt.ForumTopic).WithMany(ft => ft.ForumTopicTags).HasForeignKey(ftt => ftt.ForumTopicId);
                entity.HasOne(ftt => ftt.Tag).WithMany(t => t.ForumTopicTags).HasForeignKey(ftt => ftt.TagId);
                entity.HasIndex(ftt => new { ftt.ForumTopicId, ftt.TagId }).IsUnique();
            });

            modelBuilder.Entity<BlogPostTag>(entity =>
            {
                entity.HasKey(bpt => bpt.Id);
                entity.HasOne(bpt => bpt.BlogPost).WithMany(bp => bp.BlogPostTags).HasForeignKey(bpt => bpt.BlogPostId);
                entity.HasOne(bpt => bpt.Tag).WithMany(t => t.BlogPostTags).HasForeignKey(bpt => bpt.TagId);
                entity.HasIndex(bpt => new { bpt.BlogPostId, bpt.TagId }).IsUnique();
            });

            // RefreshToken configurations
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(rt => rt.Id);
                entity.Property(rt => rt.Token).IsRequired();
                entity.Property(rt => rt.JwtId).IsRequired();
                entity.HasOne(rt => rt.User).WithMany(u => u.RefreshTokens).HasForeignKey(rt => rt.UserId);
                entity.HasIndex(rt => rt.Token).IsUnique();
                entity.HasIndex(rt => rt.JwtId).IsUnique();
            });

            // Notification configurations
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.Id);
                entity.Property(n => n.Title).IsRequired().HasMaxLength(200);
                entity.Property(n => n.Message).IsRequired().HasMaxLength(1000);
                entity.Property(n => n.Type).HasConversion<int>();
                entity.HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(n => n.TriggeredByUser).WithMany(u => u.TriggeredNotifications).HasForeignKey(n => n.TriggeredByUserId).OnDelete(DeleteBehavior.SetNull);
                entity.HasIndex(n => new { n.UserId, n.IsRead });
                entity.HasIndex(n => new { n.UserId, n.CreatedDate });
            });

            // Report configurations
            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.Reason).IsRequired().HasMaxLength(500);
                entity.Property(r => r.ReportableType).HasConversion<int>();
                entity.Property(r => r.ReportType).HasConversion<int>();
                entity.Property(r => r.Status).HasConversion<int>();
                entity.HasOne(r => r.Reporter).WithMany(u => u.Reports).HasForeignKey(r => r.ReporterId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(r => r.ReviewedByUser).WithMany(u => u.ReviewedReports).HasForeignKey(r => r.ReviewedByUserId).OnDelete(DeleteBehavior.SetNull);
                entity.HasIndex(r => new { r.ReportableType, r.ReportableEntityId });
                entity.HasIndex(r => new { r.ReporterId, r.ReportableType, r.ReportableEntityId }).IsUnique();
                entity.HasIndex(r => r.Status);
            });

            // Favorite configurations - Clean implementation
            modelBuilder.Entity<Favorite>(entity =>
            {
                entity.ToTable("Favorites");
                entity.HasKey(f => f.Id);
                entity.Property(f => f.FavoriteType).HasConversion<int>();
                entity.Property(f => f.UserId).IsRequired();
                entity.Property(f => f.TargetEntityId).IsRequired();
                entity.Property(f => f.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                
                // Foreign key relationship
                entity.HasOne(f => f.User)
                      .WithMany(u => u.Favorites)
                      .HasForeignKey(f => f.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                // Indexes for performance
                entity.HasIndex(f => new { f.UserId, f.FavoriteType, f.TargetEntityId }).IsUnique();
                entity.HasIndex(f => new { f.FavoriteType, f.TargetEntityId });
                entity.HasIndex(f => f.CreatedDate);
            });

            // Keyword configurations
            modelBuilder.Entity<Keyword>(entity =>
            {
                entity.HasKey(k => k.Id);
                entity.Property(k => k.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(k => k.IGDBId).IsUnique();
                entity.HasIndex(k => k.Name).IsUnique();
            });

            // PlayerPerspective configurations
            modelBuilder.Entity<PlayerPerspective>(entity =>
            {
                entity.HasKey(pp => pp.Id);
                entity.Property(pp => pp.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(pp => pp.IGDBId).IsUnique();
                entity.HasIndex(pp => pp.Name).IsUnique();
            });

            // GameKeyword configurations
            modelBuilder.Entity<GameKeyword>(entity =>
            {
                entity.HasKey(gk => new { gk.GameId, gk.KeywordId });
                entity.HasOne(gk => gk.Game).WithMany(g => g.GameKeywords).HasForeignKey(gk => gk.GameId);
                entity.HasOne(gk => gk.Keyword).WithMany(k => k.GameKeywords).HasForeignKey(gk => gk.KeywordId);
            });

            // GamePlayerPerspective configurations
            modelBuilder.Entity<GamePlayerPerspective>(entity =>
            {
                entity.HasKey(gpp => new { gpp.GameId, gpp.PlayerPerspectiveId });
                entity.HasOne(gpp => gpp.Game).WithMany(g => g.GamePlayerPerspectives).HasForeignKey(gpp => gpp.GameId);
                entity.HasOne(gpp => gpp.PlayerPerspective).WithMany(pp => pp.GamePlayerPerspectives).HasForeignKey(gpp => gpp.PlayerPerspectiveId);
            });
            
            // GameBeatTime configurations
            modelBuilder.Entity<GameBeatTime>(entity =>
            {
                entity.HasKey(gbt => gbt.Id);
                entity.Property(gbt => gbt.HltbGameName).HasMaxLength(200);
                entity.HasOne(gbt => gbt.Game).WithOne(g => g.GameBeatTime).HasForeignKey<GameBeatTime>(gbt => gbt.GameId).OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(gbt => gbt.GameId).IsUnique();
                entity.HasIndex(gbt => gbt.HltbGameId);
            });
            
            // GameIgdbRating configurations
            modelBuilder.Entity<GameIgdbRating>(entity =>
            {
                entity.HasKey(gir => gir.Id);
                entity.Property(gir => gir.UserRating).HasColumnType("decimal(5,2)");
                entity.Property(gir => gir.CriticRating).HasColumnType("decimal(5,2)");
                entity.HasOne(gir => gir.Game).WithOne(g => g.GameIgdbRating).HasForeignKey<GameIgdbRating>(gir => gir.GameId).OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(gir => gir.GameId).IsUnique();
            });

            // Guide configurations - Updated for block system
            modelBuilder.Entity<Guide>(entity =>
            {
                entity.HasKey(g => g.Id);
                entity.Property(g => g.Title).IsRequired().HasMaxLength(200);
                entity.Property(g => g.Summary).HasMaxLength(500);
                entity.Property(g => g.ThumbnailUrl).HasMaxLength(500);
                entity.Property(g => g.TableOfContents).HasColumnType("nvarchar(max)");
                entity.Property(g => g.Difficulty).IsRequired().HasMaxLength(50);
                entity.Property(g => g.AverageRating).HasColumnType("decimal(3,2)");
                entity.HasOne(g => g.Game).WithMany(game => game.Guides).HasForeignKey(g => g.GameId);
                entity.HasOne(g => g.User).WithMany(u => u.Guides).HasForeignKey(g => g.UserId);
                entity.HasOne(g => g.GuideCategory).WithMany(gc => gc.Guides).HasForeignKey(g => g.GuideCategoryId).OnDelete(DeleteBehavior.SetNull);
                entity.HasIndex(g => g.GameId);
                entity.HasIndex(g => g.UserId);
                entity.HasIndex(g => g.GuideCategoryId);
                entity.HasIndex(g => g.IsPublished);
                entity.HasIndex(g => g.IsFeatured);
                entity.HasIndex(g => g.CreatedDate);
            });

            // GuideBlock configurations
            modelBuilder.Entity<GuideBlock>(entity =>
            {
                entity.HasKey(gb => gb.Id);
                entity.Property(gb => gb.BlockType).HasConversion<int>();
                entity.Property(gb => gb.Content).HasColumnType("nvarchar(max)");
                entity.Property(gb => gb.MediaUrl).HasMaxLength(500);
                entity.Property(gb => gb.Caption).HasMaxLength(300);
                entity.Property(gb => gb.Title).HasMaxLength(200);
                entity.Property(gb => gb.Metadata).HasColumnType("nvarchar(max)");
                entity.HasOne(gb => gb.Guide).WithMany(g => g.GuideBlocks).HasForeignKey(gb => gb.GuideId).OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(gb => new { gb.GuideId, gb.Order });
            });

            // Friendship configurations
            modelBuilder.Entity<Friendship>(entity =>
            {
                entity.HasKey(f => f.Id);
                entity.Property(f => f.Status).HasConversion<int>();
                entity.HasOne(f => f.Sender).WithMany(u => u.SentFriendRequests).HasForeignKey(f => f.SenderId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(f => f.Receiver).WithMany(u => u.ReceivedFriendRequests).HasForeignKey(f => f.ReceiverId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(f => new { f.SenderId, f.ReceiverId }).IsUnique();
                entity.HasIndex(f => f.Status);
            });

            // Follow configurations
            modelBuilder.Entity<Follow>(entity =>
            {
                entity.HasKey(f => f.Id);
                entity.HasOne(f => f.Follower).WithMany(u => u.Following).HasForeignKey(f => f.FollowerId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(f => f.Following).WithMany(u => u.Followers).HasForeignKey(f => f.FollowingId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(f => new { f.FollowerId, f.FollowingId }).IsUnique();
                entity.HasIndex(f => f.IsActive);
            });

            // Conversation configurations
            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Type).HasConversion<int>();
                entity.Property(c => c.Title).HasMaxLength(100);
                entity.Property(c => c.Description).HasMaxLength(500);
                entity.Property(c => c.GroupImageUrl).HasMaxLength(500);
                entity.HasOne(c => c.CreatedBy).WithMany(u => u.CreatedConversations).HasForeignKey(c => c.CreatedById).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(c => c.LastMessage).WithMany().HasForeignKey(c => c.LastMessageId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(c => c.IsActive);
                entity.HasIndex(c => c.LastMessageAt);
            });

            // ConversationParticipant configurations
            modelBuilder.Entity<ConversationParticipant>(entity =>
            {
                entity.HasKey(cp => cp.Id);
                entity.Property(cp => cp.Role).HasConversion<int>();
                entity.HasOne(cp => cp.Conversation).WithMany(c => c.Participants).HasForeignKey(cp => cp.ConversationId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(cp => cp.User).WithMany(u => u.ConversationParticipants).HasForeignKey(cp => cp.UserId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(cp => new { cp.ConversationId, cp.UserId }).IsUnique();
                entity.HasIndex(cp => cp.IsActive);
            });

            // Message configurations
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.Id);
                entity.Property(m => m.Type).HasConversion<int>();
                entity.Property(m => m.Status).HasConversion<int>();
                entity.Property(m => m.Content).HasMaxLength(2000);
                entity.Property(m => m.MediaUrl).HasMaxLength(500);
                entity.Property(m => m.MediaType).HasMaxLength(50);
                entity.Property(m => m.MediaDimensions).HasMaxLength(100);
                entity.HasOne(m => m.Conversation).WithMany(c => c.Messages).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(m => m.ReplyToMessage).WithMany(m => m.Replies).HasForeignKey(m => m.ReplyToMessageId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(m => new { m.ConversationId, m.CreatedAt });
                entity.HasIndex(m => m.IsDeleted);
            });

            // MessageRead configurations
            modelBuilder.Entity<MessageRead>(entity =>
            {
                entity.HasKey(mr => mr.Id);
                entity.HasOne(mr => mr.Message).WithMany(m => m.MessageReads).HasForeignKey(mr => mr.MessageId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(mr => mr.User).WithMany(u => u.MessageReads).HasForeignKey(mr => mr.UserId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(mr => new { mr.MessageId, mr.UserId }).IsUnique();
                entity.HasIndex(mr => mr.ReadAt);
            });

            // MessageReaction configurations
            modelBuilder.Entity<MessageReaction>(entity =>
            {
                entity.HasKey(mr => mr.Id);
                entity.Property(mr => mr.Emoji).IsRequired().HasMaxLength(10);
                entity.HasOne(mr => mr.Message).WithMany(m => m.Reactions).HasForeignKey(mr => mr.MessageId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(mr => mr.User).WithMany(u => u.MessageReactions).HasForeignKey(mr => mr.UserId).OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(mr => new { mr.MessageId, mr.UserId, mr.Emoji }).IsUnique();
            });

            // Admin Panel configurations
            ConfigureAdminEntities(modelBuilder);

            // Seed Data
            SeedData(modelBuilder);
        }

        private static void ConfigureAdminEntities(ModelBuilder modelBuilder)
        {
            // AdminPermission configurations
            modelBuilder.Entity<AdminPermission>(entity =>
            {
                entity.HasKey(ap => ap.Id);
                entity.Property(ap => ap.Name).IsRequired().HasMaxLength(100);
                entity.Property(ap => ap.Key).IsRequired().HasMaxLength(100);
                entity.Property(ap => ap.Description).HasMaxLength(500);
                entity.Property(ap => ap.Category).IsRequired().HasMaxLength(50);
                entity.HasIndex(ap => ap.Key).IsUnique();
                entity.HasIndex(ap => ap.Category);
                entity.HasIndex(ap => ap.IsActive);
            });

            // UserAdminPermission configurations
            modelBuilder.Entity<UserAdminPermission>(entity =>
            {
                entity.HasKey(uap => uap.Id);
                entity.HasOne(uap => uap.User)
                      .WithMany(u => u.AdminPermissions)
                      .HasForeignKey(uap => uap.UserId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(uap => uap.AdminPermission)
                      .WithMany(ap => ap.UserPermissions)
                      .HasForeignKey(uap => uap.AdminPermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(uap => uap.GrantedByUser)
                      .WithMany(u => u.GrantedPermissions)
                      .HasForeignKey(uap => uap.GrantedByUserId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(uap => uap.RevokedByUser)
                      .WithMany(u => u.RevokedPermissions)
                      .HasForeignKey(uap => uap.RevokedByUserId)
                      .OnDelete(DeleteBehavior.SetNull);
                entity.HasIndex(uap => new { uap.UserId, uap.AdminPermissionId }).IsUnique();
                entity.HasIndex(uap => uap.IsActive);
                entity.HasIndex(uap => uap.GrantedAt);
            });

            // AuditLog configurations
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(al => al.Id);
                entity.Property(al => al.Action).IsRequired().HasMaxLength(100);
                entity.Property(al => al.EntityType).IsRequired().HasMaxLength(100);
                entity.Property(al => al.EntityName).HasMaxLength(100);
                entity.Property(al => al.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(al => al.UserAgent).HasMaxLength(500);
                entity.Property(al => al.Notes).HasMaxLength(1000);
                entity.Property(al => al.Level).HasConversion<int>();
                entity.HasOne(al => al.User)
                      .WithMany(u => u.AuditLogs)
                      .HasForeignKey(al => al.UserId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasIndex(al => new { al.UserId, al.Timestamp });
                entity.HasIndex(al => new { al.EntityType, al.EntityId });
                entity.HasIndex(al => al.Level);
                entity.HasIndex(al => al.Timestamp);
            });
        }

        private static void SeedData(ModelBuilder modelBuilder)
        {
            // Static date for seed data consistency
            var seedDate = new DateTime(2025, 8, 10, 12, 0, 0, DateTimeKind.Utc);
            
            // Forum Categories seed data
            modelBuilder.Entity<ForumCategory>().HasData(
                new ForumCategory { Id = 1, Name = "Genel Tartışma", Description = "Genel oyun tartışmaları", CreatedDate = seedDate },
                new ForumCategory { Id = 2, Name = "Yardım & Destek", Description = "Oyun yardımları ve teknik destek", CreatedDate = seedDate },
                new ForumCategory { Id = 3, Name = "Oyun İncelemeleri", Description = "Oyun inceleme ve değerlendirmeleri", CreatedDate = seedDate },
                new ForumCategory { Id = 4, Name = "Haberler", Description = "Oyun dünyasından haberler", CreatedDate = seedDate },
                new ForumCategory { Id = 5, Name = "Rehberler & İpuçları", Description = "Oyun rehberleri ve ipuçları", CreatedDate = seedDate },
                new ForumCategory { Id = 6, Name = "Çok Oyunculu", Description = "Multiplayer oyun tartışmaları", CreatedDate = seedDate },
                new ForumCategory { Id = 7, Name = "E-Spor", Description = "E-spor ve turnuva tartışmaları", CreatedDate = seedDate },
                new ForumCategory { Id = 8, Name = "İndirimler", Description = "Oyun indirim ve kampanyaları", CreatedDate = seedDate },
                new ForumCategory { Id = 9, Name = "Mod & Özelleştirme", Description = "Oyun modları ve özelleştirmeler", CreatedDate = seedDate },
                new ForumCategory { Id = 10, Name = "PC Gaming", Description = "PC oyun donanımı ve optimizasyon", CreatedDate = seedDate },
                new ForumCategory { Id = 11, Name = "Konsol Gaming", Description = "Konsol oyun tartışmaları", CreatedDate = seedDate },
                new ForumCategory { Id = 12, Name = "Mobile Gaming", Description = "Mobil oyun tartışmaları", CreatedDate = seedDate },
                new ForumCategory { Id = 13, Name = "Retro Gaming", Description = "Eski ve klasik oyunlar", CreatedDate = seedDate },
                new ForumCategory { Id = 14, Name = "Indie Oyunlar", Description = "Bağımsız oyun geliştiricileri", CreatedDate = seedDate },
                new ForumCategory { Id = 15, Name = "Diğer", Description = "Diğer konular", CreatedDate = seedDate }
            );

            // Blog Categories seed data
            modelBuilder.Entity<BlogCategory>().HasData(
                new BlogCategory { Id = 1, Name = "İncelemeler", Description = "Oyun incelemeleri ve değerlendirmeler", Color = "#3B82F6", Order = 1, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 2, Name = "Haberler", Description = "Oyun dünyasından son haberler", Color = "#EF4444", Order = 2, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 3, Name = "Rehberler", Description = "Oyun rehberleri ve ipuçları", Color = "#10B981", Order = 3, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 4, Name = "Teknoloji", Description = "Gaming teknolojileri ve donanım", Color = "#8B5CF6", Order = 4, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 5, Name = "E-Spor", Description = "E-spor haberleri ve analizler", Color = "#F59E0B", Order = 5, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 6, Name = "Endüstri", Description = "Oyun endüstrisi analiz ve yorumlar", Color = "#6366F1", Order = 6, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 7, Name = "Retrospektif", Description = "Eski oyunlar ve nostalji", Color = "#84CC16", Order = 7, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 8, Name = "Kişisel Deneyim", Description = "Kişisel oyun deneyimleri", Color = "#06B6D4", Order = 8, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 9, Name = "Topluluk", Description = "Oyuncu toplulukları ve etkinlikler", Color = "#EC4899", Order = 9, CreatedDate = seedDate, UpdatedDate = seedDate },
                new BlogCategory { Id = 10, Name = "Diğer", Description = "Genel oyun konuları", Color = "#6B7280", Order = 10, CreatedDate = seedDate, UpdatedDate = seedDate }
            );

            // Guide Categories seed data (Diğer at the end)
            modelBuilder.Entity<GuideCategory>().HasData(
                new GuideCategory { Id = 1, Name = "Başlangıç Rehberi", Description = "Yeni başlayanlar için temel rehberler", IconClass = "fas fa-play-circle", Order = 1, CreatedDate = seedDate },
                new GuideCategory { Id = 2, Name = "Görev Rehberleri", Description = "Ana ve yan görevler için detaylı rehberler", IconClass = "fas fa-tasks", Order = 2, CreatedDate = seedDate },
                new GuideCategory { Id = 3, Name = "Boss Savaşları", Description = "Zorlu boss mücadeleleri için stratejiler", IconClass = "fas fa-dragon", Order = 3, CreatedDate = seedDate },
                new GuideCategory { Id = 4, Name = "PvP Rehberleri", Description = "Oyuncu karşı oyuncu mücadele rehberleri", IconClass = "fas fa-sword", Order = 4, CreatedDate = seedDate },
                new GuideCategory { Id = 5, Name = "Build Rehberleri", Description = "Karakter ve ekipman build rehberleri", IconClass = "fas fa-tools", Order = 5, CreatedDate = seedDate },
                new GuideCategory { Id = 6, Name = "Koleksiyonlar", Description = "Eşya, başarım ve koleksiyon rehberleri", IconClass = "fas fa-trophy", Order = 6, CreatedDate = seedDate },
                new GuideCategory { Id = 7, Name = "Speedrun", Description = "Hızlı tamamlama teknikleri", IconClass = "fas fa-stopwatch", Order = 7, CreatedDate = seedDate },
                new GuideCategory { Id = 8, Name = "Mod Rehberleri", Description = "Oyun modifikasyonları rehberleri", IconClass = "fas fa-wrench", Order = 8, CreatedDate = seedDate },
                new GuideCategory { Id = 9, Name = "Optimizasyon", Description = "Performans ve ayar optimizasyonu", IconClass = "fas fa-cog", Order = 9, CreatedDate = seedDate },
                new GuideCategory { Id = 10, Name = "Ekonomi", Description = "Oyun içi ekonomi ve ticaret rehberleri", IconClass = "fas fa-coins", Order = 10, CreatedDate = seedDate },
                new GuideCategory { Id = 11, Name = "Haritalar", Description = "Harita ve konum rehberleri", IconClass = "fas fa-map", Order = 11, CreatedDate = seedDate },
                new GuideCategory { Id = 12, Name = "Karakterler", Description = "Karakter seçimi ve gelişimi", IconClass = "fas fa-user-friends", Order = 12, CreatedDate = seedDate },
                new GuideCategory { Id = 13, Name = "Sırlar", Description = "Gizli içerikler ve easter egg'ler", IconClass = "fas fa-eye", Order = 13, CreatedDate = seedDate },
                new GuideCategory { Id = 14, Name = "İpuçları", Description = "Genel oyun ipuçları ve taktikler", IconClass = "fas fa-lightbulb", Order = 14, CreatedDate = seedDate },
                new GuideCategory { Id = 15, Name = "Diğer", Description = "Diğer rehber türleri", IconClass = "fas fa-ellipsis-h", Order = 99, CreatedDate = seedDate }
            );

            // Admin Permissions seed data - Base permissions for admin system
            modelBuilder.Entity<AdminPermission>().HasData(
                // User Management
                new AdminPermission { Id = 1, Name = "Kullanıcı Yönetimi", Key = "users.manage", Description = "Kullanıcıları görüntüleme, düzenleme", Category = "User Management", Order = 1, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate },
                new AdminPermission { Id = 2, Name = "İçerik Yönetimi", Key = "content.manage", Description = "Blog ve rehberleri yönetme", Category = "Content Management", Order = 2, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate },
                new AdminPermission { Id = 3, Name = "Forum Yönetimi", Key = "forum.manage", Description = "Forum konularını yönetme", Category = "Content Management", Order = 3, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate },
                new AdminPermission { Id = 4, Name = "Oyun Yönetimi", Key = "games.manage", Description = "Oyun verilerini yönetme", Category = "Game Management", Order = 4, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate },
                new AdminPermission { Id = 5, Name = "Rapor Yönetimi", Key = "reports.manage", Description = "Raporları inceleme ve çözme", Category = "Report Management", Order = 5, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate },
                new AdminPermission { Id = 6, Name = "Sistem Yönetimi", Key = "system.manage", Description = "Sistem ayarları ve istatistikler", Category = "System Management", Order = 6, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate },
                new AdminPermission { Id = 7, Name = "Admin Yönetimi", Key = "admin.manage", Description = "Admin yetkilerini yönetme", Category = "Admin Management", Order = 7, IsActive = true, CreatedDate = seedDate, UpdatedDate = seedDate }
            );
        }
    }
}