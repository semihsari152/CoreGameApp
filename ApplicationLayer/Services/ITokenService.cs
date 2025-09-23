using ApplicationLayer.DTOs;
using DomainLayer.Entities;

namespace ApplicationLayer.Services
{
    public interface ITokenService
    {
        Task<AuthenticationResponseDto> GenerateTokensAsync(UserDto user);
        Task<AuthenticationResponseDto> RefreshTokenAsync(string accessToken, string refreshToken);
        Task<bool> RevokeTokenAsync(string refreshToken);
        Task<bool> RevokeAllUserTokensAsync(int userId);
        Task CleanupExpiredTokensAsync();
    }
}