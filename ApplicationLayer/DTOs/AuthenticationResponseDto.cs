namespace ApplicationLayer.DTOs
{
    public class AuthenticationResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserDto User { get; set; } = null!;
    }

    public class RefreshTokenRequestDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class UpdateUserRoleDto
    {
        public int UserId { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}