using DomainLayer.Entities;
using DomainLayer.Enums;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using Microsoft.EntityFrameworkCore;

namespace InfrastructureLayer.Services
{
    public class DatabaseSeeder
    {
        private readonly AppDbContext _context;
        private readonly IUnitOfWork _unitOfWork;

        public DatabaseSeeder(AppDbContext context, IUnitOfWork unitOfWork)
        {
            _context = context;
            _unitOfWork = unitOfWork;
        }

        public async Task SeedAsync()
        {
            // Ensure database is created
            await _context.Database.EnsureCreatedAsync();

            // Seed admin user
            await SeedAdminUserAsync();

            // Seed basic genres
            await SeedBasicGenresAsync();

            // Seed basic tags
            await SeedBasicTagsAsync();

            // Seed forum categories
            await SeedForumCategoriesAsync();

            await _context.SaveChangesAsync();
        }

        private async Task SeedAdminUserAsync()
        {
            // Check if any users already exist
            var hasUsers = await _context.Users.AnyAsync();
            if (hasUsers) return;

            // Create multiple users with different roles
            var users = new List<User>
            {
                // Admin user
                new User
                {
                    Username = "admin",
                    Email = "admin@coregameapp.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
                    Role = UserRole.Admin,
                    Status = (int)UserStatus.Active,
                    Level = 100,
                    XP = 999999,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow,
                    LastLoginDate = DateTime.UtcNow,
                    Bio = "System Administrator - This is the main admin account with full system privileges."
                },
                // Moderator user
                new User
                {
                    Username = "moderator",
                    Email = "moderator@coregameapp.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
                    Role = UserRole.Moderator,
                    Status = (int)UserStatus.Active,
                    Level = 50,
                    XP = 50000,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow,
                    LastLoginDate = DateTime.UtcNow,
                    Bio = "Platform Moderatörü - Topluluk kurallarının uygulanmasından sorumlu."
                },
                // Regular users
                new User
                {
                    Username = "gamerhasan",
                    Email = "hasan@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
                    Role = UserRole.User,
                    Status = (int)UserStatus.Active,
                    Level = 15,
                    XP = 12500,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-30),
                    LastLoginDate = DateTime.UtcNow.AddHours(-2),
                    Bio = "Oyun tutkunu. En çok RPG ve aksiyon oyunları severim."
                },
                new User
                {
                    Username = "ayseozkan",
                    Email = "ayse@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
                    Role = UserRole.User,
                    Status = (int)UserStatus.Active,
                    Level = 8,
                    XP = 4200,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-15),
                    LastLoginDate = DateTime.UtcNow.AddDays(-1),
                    Bio = "İndie oyunları ve simülasyon oyunları ile vakit geçirmeyi seviyorum."
                },
                new User
                {
                    Username = "mehmetgamer",
                    Email = "mehmet@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test123!"),
                    Role = UserRole.User,
                    Status = (int)UserStatus.Active,
                    Level = 25,
                    XP = 35000,
                    IsEmailVerified = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-60),
                    LastLoginDate = DateTime.UtcNow.AddMinutes(-15),
                    Bio = "FPS ve yarış oyunları uzmanı. Turnuvalara katılmayı severim."
                }
            };

            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();
        }

        private async Task SeedBasicGenresAsync()
        {
            var genres = new[]
            {
                new Genre { Name = "Aksiyon", Description = "Aksiyon oyunları" },
                new Genre { Name = "Macera", Description = "Macera oyunları" },
                new Genre { Name = "RPG", Description = "Rol yapma oyunları" },
                new Genre { Name = "Strateji", Description = "Strateji oyunları" },
                new Genre { Name = "Simülasyon", Description = "Simülasyon oyunları" },
                new Genre { Name = "Yarış", Description = "Yarış oyunları" },
                new Genre { Name = "Spor", Description = "Spor oyunları" },
                new Genre { Name = "Bulmaca", Description = "Bulmaca oyunları" }
            };

            foreach (var genre in genres)
            {
                var exists = await _context.Genres.AnyAsync(g => g.Name == genre.Name);
                if (!exists)
                {
                    await _context.Genres.AddAsync(genre);
                }
            }
        }

        private async Task SeedBasicTagsAsync()
        {
            var tags = new[]
            {
                new Tag { Name = "Multiplayer", Description = "Çok oyunculu oyunlar" },
                new Tag { Name = "Singleplayer", Description = "Tek oyunculu oyunlar" },
                new Tag { Name = "Co-op", Description = "İşbirlikli oyunlar" },
                new Tag { Name = "PvP", Description = "Oyuncu vs Oyuncu" },
                new Tag { Name = "Open World", Description = "Açık dünya oyunları" },
                new Tag { Name = "Indie", Description = "Bağımsız oyunlar" },
                new Tag { Name = "Early Access", Description = "Erken erişim oyunları" },
                new Tag { Name = "Free to Play", Description = "Ücretsiz oyunlar" }
            };

            foreach (var tag in tags)
            {
                var exists = await _context.Tags.AnyAsync(t => t.Name == tag.Name);
                if (!exists)
                {
                    await _context.Tags.AddAsync(tag);
                }
            }
        }

        private async Task SeedForumCategoriesAsync()
        {
            var forumCategories = new[]
            {
                new ForumCategory { Name = "Genel Tartışma", Description = "Genel oyun tartışmaları", Order = 1 },
                new ForumCategory { Name = "Oyun Önerileri", Description = "Oyun önerileri ve değerlendirmeleri", Order = 2 },
                new ForumCategory { Name = "Teknik Destek", Description = "Teknik yardım ve destek", Order = 3 },
                new ForumCategory { Name = "Rehberler", Description = "Oyun rehberleri ve taktikleri", Order = 4 },
                new ForumCategory { Name = "Turnuvalar", Description = "Turnuva duyuruları ve organizasyonları", Order = 5 }
            };

            foreach (var category in forumCategories)
            {
                var exists = await _context.ForumCategories.AnyAsync(fc => fc.Name == category.Name);
                if (!exists)
                {
                    await _context.ForumCategories.AddAsync(category);
                }
            }
        }
    }
}