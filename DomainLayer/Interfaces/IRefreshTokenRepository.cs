using DomainLayer.Entities;

namespace DomainLayer.Interfaces
{
    public interface IRefreshTokenRepository : IRepository<RefreshToken>
    {
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task<RefreshToken?> GetByJwtIdAsync(string jwtId);
        Task<IEnumerable<RefreshToken>> GetUserTokensAsync(int userId);
        Task<IEnumerable<RefreshToken>> GetExpiredTokensAsync();
    }
}