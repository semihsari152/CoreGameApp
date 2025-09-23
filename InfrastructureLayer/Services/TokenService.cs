using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using Microsoft.EntityFrameworkCore;
using InfrastructureLayer.Data;

namespace InfrastructureLayer.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly IUnitOfWork _unitOfWork;

        public TokenService(IConfiguration configuration, AppDbContext context, IUnitOfWork unitOfWork)
        {
            _configuration = configuration;
            _context = context;
            _unitOfWork = unitOfWork;
        }

        public async Task<AuthenticationResponseDto> GenerateTokensAsync(UserDto user)
        {
            var jwtToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            var jwtId = GetJwtId(jwtToken);

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                JwtId = jwtId,
                UserId = user.Id,
                CreatedDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddDays(7), // Refresh token expires in 7 days
                IsUsed = false,
                IsRevoked = false
            };

            await _context.RefreshTokens.AddAsync(refreshTokenEntity);
            await _context.SaveChangesAsync();

            return new AuthenticationResponseDto
            {
                AccessToken = jwtToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(1), // Access token expires in 1 day
                User = user
            };
        }

        public async Task<AuthenticationResponseDto> RefreshTokenAsync(string accessToken, string refreshToken)
        {
            var validatedToken = GetPrincipalFromToken(accessToken);
            if (validatedToken == null)
            {
                throw new SecurityTokenException("Invalid access token");
            }

            var expiryDateUnix = long.Parse(validatedToken.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Exp).Value);
            var expiryDateTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddSeconds(expiryDateUnix);

            if (expiryDateTime > DateTime.UtcNow)
            {
                throw new SecurityTokenException("This token hasn't expired yet");
            }

            var jti = validatedToken.Claims.Single(x => x.Type == JwtRegisteredClaimNames.Jti).Value;
            var storedRefreshToken = await _context.RefreshTokens.SingleOrDefaultAsync(x => x.Token == refreshToken);

            if (storedRefreshToken == null)
            {
                throw new SecurityTokenException("This refresh token does not exist");
            }

            if (DateTime.UtcNow > storedRefreshToken.ExpiryDate)
            {
                throw new SecurityTokenException("This refresh token has expired");
            }

            if (storedRefreshToken.IsUsed)
            {
                throw new SecurityTokenException("This refresh token has been used");
            }

            if (storedRefreshToken.IsRevoked)
            {
                throw new SecurityTokenException("This refresh token has been revoked");
            }

            if (storedRefreshToken.JwtId != jti)
            {
                throw new SecurityTokenException("This refresh token does not match this JWT");
            }

            // Update the refresh token as used
            storedRefreshToken.IsUsed = true;
            _context.RefreshTokens.Update(storedRefreshToken);
            await _context.SaveChangesAsync();

            // Get user and generate new tokens
            var user = await _unitOfWork.Users.GetByIdAsync(storedRefreshToken.UserId);
            if (user == null)
            {
                throw new SecurityTokenException("User not found");
            }

            var userDto = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                Level = user.Level,
                XP = user.XP,
                AvatarUrl = user.AvatarUrl,
                Bio = user.Bio,
                IsEmailVerified = user.IsEmailVerified,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedDate,
                LastLoginAt = user.LastLoginDate
            };

            return await GenerateTokensAsync(userDto);
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            var storedRefreshToken = await _context.RefreshTokens.SingleOrDefaultAsync(x => x.Token == refreshToken);
            if (storedRefreshToken == null)
            {
                return false;
            }

            storedRefreshToken.IsRevoked = true;
            _context.RefreshTokens.Update(storedRefreshToken);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RevokeAllUserTokensAsync(int userId)
        {
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in userTokens)
            {
                token.IsRevoked = true;
            }

            _context.RefreshTokens.UpdateRange(userTokens);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task CleanupExpiredTokensAsync()
        {
            var expiredTokens = await _context.RefreshTokens
                .Where(rt => rt.ExpiryDate < DateTime.UtcNow)
                .ToListAsync();

            _context.RefreshTokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();
        }

        private string GenerateJwtToken(UserDto user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
            var jwtAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("userId", user.Id.ToString()), // Add userId claim for API controllers
                new Claim("username", user.Username),
                new Claim("firstName", user.FirstName ?? ""),
                new Claim("lastName", user.LastName ?? ""),
                new Claim("level", user.Level.ToString()),
                new Claim("xp", user.XP.ToString()),
                new Claim("bio", user.Bio ?? ""),
                new Claim("isEmailVerified", user.IsEmailVerified.ToString()),
                new Claim("isActive", user.IsActive.ToString())
            };

            // Add avatar URL if exists
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                claims.Add(new Claim("avatarUrl", user.AvatarUrl));
            }

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1), // 1 day expiration
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private string GetJwtId(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwt = tokenHandler.ReadJwtToken(token);
            return jwt.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Jti).Value;
        }

        private ClaimsPrincipal? GetPrincipalFromToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
            var key = Encoding.UTF8.GetBytes(jwtKey);

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false, // We don't care about expiration here
                ClockSkew = TimeSpan.Zero
            };

            try
            {
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var validatedToken);
                return validatedToken is JwtSecurityToken jwtSecurityToken && 
                       jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase) 
                       ? principal : null;
            }
            catch
            {
                return null;
            }
        }
    }
}