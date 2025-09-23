using DomainLayer.Entities;
using DomainLayer.Enums;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace InfrastructureLayer.Data
{
    public static class DataSeeder
    {
        public static async Task SeedTestDataAsync(AppDbContext context)
        {
            // Eğer kullanıcı verisi varsa seeding yapma
            if (await context.Users.AnyAsync())
            {
                return;
            }

            // Sadece bir admin kullanıcısı oluştur
            var users = new List<User>
            {
                new User
                {
                    Username = "admin",
                    Email = "admin@example.com",
                    FirstName = "Admin",
                    LastName = "User",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = UserRole.Admin,
                    IsEmailVerified = true,
                    IsActive = true,
                    Status = 0, // Active status
                    CreatedDate = DateTime.UtcNow,
                    LastLoginDate = DateTime.UtcNow,
                    XP = 999999,
                    Level = 100
                }
            };

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();

            // Admin permissions seed - check if already exists
            var existingPermissions = await context.AdminPermissions.ToListAsync();
            List<AdminPermission> adminPermissions;
            
            if (!existingPermissions.Any())
            {
                adminPermissions = new List<AdminPermission>
                {
                    new AdminPermission
                    {
                        Name = "User Management",
                        Key = "users.manage",
                        Category = "User Management",
                        Description = "Manage users, ban, unban, edit profiles",
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    },
                    new AdminPermission
                    {
                        Name = "Content Management",
                        Key = "content.manage",
                        Category = "Content Management", 
                        Description = "Manage posts, comments, guides, forums",
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    },
                    new AdminPermission
                    {
                        Name = "System Management",
                        Key = "system.manage",
                        Category = "System Management",
                        Description = "System settings, maintenance, logs",
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    },
                    new AdminPermission
                    {
                        Name = "Admin Management",
                        Key = "admin.manage",
                        Category = "Admin Management",
                        Description = "Manage admin users and permissions",
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    }
                };

                await context.AdminPermissions.AddRangeAsync(adminPermissions);
                await context.SaveChangesAsync();
            }
            else
            {
                adminPermissions = existingPermissions;
            }

            // Give admin user all permissions - Get fresh user ID from database
            var adminUser = await context.Users.FirstAsync(u => u.Email == "admin@example.com");
            
            // Check if admin permissions already granted
            var existingAdminPermissions = await context.UserAdminPermissions
                .Where(uap => uap.UserId == adminUser.Id)
                .ToListAsync();
                
            if (!existingAdminPermissions.Any())
            {
                var userAdminPermissions = adminPermissions.Select(permission => new UserAdminPermission
                {
                    UserId = adminUser.Id,
                    AdminPermissionId = permission.Id,
                    GrantedByUserId = adminUser.Id, // Self-granted
                    GrantedAt = DateTime.UtcNow,
                    IsActive = true,
                    Notes = "Full admin access"
                }).ToList();

                await context.UserAdminPermissions.AddRangeAsync(userAdminPermissions);
                await context.SaveChangesAsync();
            }

            Console.WriteLine("Test verileri başarıyla oluşturuldu!");
        }
    }
}