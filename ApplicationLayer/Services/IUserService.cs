using ApplicationLayer.DTOs;
using DomainLayer.Enums;

namespace ApplicationLayer.Services
{
    public interface IUserService
    {
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto?> GetUserByUsernameAsync(string username);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<IEnumerable<UserDto>> GetActiveUsersAsync();
        Task<IEnumerable<UserDto>> GetUsersByRoleAsync(UserRole role);
        Task<IEnumerable<UserDto>> GetTopUsersByXPAsync(int count);
        Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateUserDto);
        Task<bool> IsUsernameExistsAsync(string username);
        Task<bool> IsEmailExistsAsync(string email);
        Task<bool> ValidatePasswordAsync(string username, string password);
        Task ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task UpdateLastLoginAsync(int userId);
        Task VerifyEmailAsync(int userId);
        Task UpdateUserXPAsync(int userId, int xpAmount);
        Task<string> GenerateJwtTokenAsync(UserDto user);
        Task<string> HashPasswordAsync(string password);
        Task SendPasswordResetCodeAsync(string email);
        Task ResetPasswordAsync(string email, string code, string newPassword);
        Task<AuthenticationResponseDto> GoogleLoginAsync(string token);
        Task<UserStatsDto?> GetUserStatsAsync(int userId);
        Task<IEnumerable<UserActivityDto>> GetUserActivityAsync(int userId);
        Task<IEnumerable<GameRatingDto>> GetUserGameRatingsAsync(int userId);
        Task<IEnumerable<ForumTopicDto>> GetUserForumPostsAsync(int userId);
        Task<IEnumerable<BlogPostDto>> GetUserBlogsAsync(int userId);
        Task<IEnumerable<GuideDto>> GetUserGuidesAsync(int userId);
        Task<IEnumerable<UserGameStatusDto>> GetUserGameStatusesAsync(int userId);
        Task SendEmailVerificationAsync(int userId);
        Task VerifyEmailWithTokenAsync(string token);
        
        // Admin Management Methods
        Task<UserDto> ToggleUserStatusAsync(int userId);
        Task<bool> DeleteUserAsync(int userId);
        Task<UserDto?> UpdateUserRoleAsync(int userId, DomainLayer.Enums.UserRole role);
    }
}