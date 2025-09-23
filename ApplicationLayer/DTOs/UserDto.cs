using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public UserRole Role { get; set; }
        public int Level { get; set; }
        public int XP { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsActive { get; set; }
        public bool IsNewUser { get; set; }
        
        // Privacy Settings
        public bool IsProfileVisible { get; set; } = true;
        public bool IsActivityStatusVisible { get; set; } = true;
        public bool IsGameListVisible { get; set; } = true;
    }

    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Bio { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserDto
    {
        public string? Username { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool? IsNewUser { get; set; }
        
        // Privacy Settings
        public bool? IsProfileVisible { get; set; }
        public bool? IsActivityStatusVisible { get; set; }
        public bool? IsGameListVisible { get; set; }
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class GoogleLoginDto
    {
        public string Token { get; set; } = string.Empty;
    }

    public class UserStatsDto
    {
        public int TotalXP { get; set; }
        public int Level { get; set; }
        public int GamesRated { get; set; }
        public int GuidesCreated { get; set; }
        public int ForumTopics { get; set; }
        public int BlogPosts { get; set; }
        public int CommentsCount { get; set; }
        public int LikesReceived { get; set; }
        public int DislikesReceived { get; set; }
        public DateTime JoinDate { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class UserActivityDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Date { get; set; }
        public int? Rating { get; set; }
        public int? GameId { get; set; }
        public string? GameName { get; set; }
        public string? Url { get; set; }
    }

    public class DeleteAccountDto
    {
        public string Password { get; set; } = string.Empty;
    }

    public class UpdatePrivacySettingsDto
    {
        public bool IsProfileVisible { get; set; }
        public bool IsActivityStatusVisible { get; set; }
        public bool IsGameListVisible { get; set; }
    }
}