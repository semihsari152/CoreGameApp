using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FluentValidation;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using ApplicationLayer.Validators;
using DomainLayer.Enums;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IValidator<CreateUserDto> _createUserValidator;

        public AuthController(IUserService userService, ITokenService tokenService, IValidator<CreateUserDto> createUserValidator)
        {
            _userService = userService;
            _tokenService = tokenService;
            _createUserValidator = createUserValidator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserDto createUserDto)
        {
            var validationResult = await _createUserValidator.ValidateAsync(createUserDto);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { 
                    message = "Validation failed", 
                    errors = validationResult.Errors.Select(e => e.ErrorMessage) 
                });
            }

            try
            {
                var user = await _userService.CreateUserAsync(createUserDto);
                var authResponse = await _tokenService.GenerateTokensAsync(user);

                return Ok(new { 
                    message = "Kayıt başarılı", 
                    data = authResponse
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (string.IsNullOrEmpty(loginDto.Email) || string.IsNullOrEmpty(loginDto.Password))
            {
                return BadRequest(new { message = "Email ve şifre gereklidir" });
            }

            try
            {
                // Get user by email
                var user = await _userService.GetUserByEmailAsync(loginDto.Email);
                if (user == null || !user.IsActive)
                {
                    return Unauthorized(new { message = "Geçersiz email veya şifre" });
                }

                // Validate password directly using BCrypt
                var isValidPassword = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
                if (!isValidPassword)
                {
                    return Unauthorized(new { message = "Geçersiz email veya şifre" });
                }

                // Update last login
                await _userService.UpdateLastLoginAsync(user.Id);

                var authResponse = await _tokenService.GenerateTokensAsync(user);

                return Ok(new { 
                    message = "Giriş başarılı", 
                    data = authResponse
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                await _userService.ChangePasswordAsync(userId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

                return Ok(new { message = "Şifre başarıyla değiştirildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _userService.GetUserByIdAsync(userId);
                
                if (user == null || !user.IsActive)
                {
                    return NotFound(new { message = "Kullanıcı bulunamadı" });
                }

                return Ok(new { 
                    message = "Profil bilgileri", 
                    data = user 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _userService.UpdateUserAsync(userId, updateUserDto);

                return Ok(new { 
                    message = "Profil güncellendi", 
                    data = user 
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("verify-email/{userId}")]
        [Authorize]
        public async Task<IActionResult> VerifyEmail(int userId)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                // Only allow users to verify their own email or admins to verify any email
                if (currentUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                await _userService.VerifyEmailAsync(userId);

                return Ok(new { message = "Email doğrulandı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            try
            {
                var authResponse = await _tokenService.RefreshTokenAsync(request.AccessToken, request.RefreshToken);
                return Ok(new { 
                    message = "Token yenilendi", 
                    data = authResponse 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("revoke-token")]
        [Authorize]
        public async Task<IActionResult> RevokeToken([FromBody] string refreshToken)
        {
            try
            {
                var result = await _tokenService.RevokeTokenAsync(refreshToken);
                if (result)
                {
                    return Ok(new { message = "Token iptal edildi" });
                }
                return BadRequest(new { message = "Token bulunamadı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] string refreshToken)
        {
            try
            {
                await _tokenService.RevokeTokenAsync(refreshToken);
                return Ok(new { message = "Çıkış yapıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("update-user-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole([FromBody] UpdateUserRoleDto request)
        {
            try
            {
                if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
                {
                    return BadRequest(new { message = "Geçersiz rol" });
                }

                await _userService.UpdateUserRoleAsync(request.UserId, role);
                return Ok(new { message = $"Kullanıcı rolü {role} olarak güncellendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("revoke-all-user-tokens/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RevokeAllUserTokens(int userId)
        {
            try
            {
                await _tokenService.RevokeAllUserTokensAsync(userId);
                return Ok(new { message = "Kullanıcının tüm tokenları iptal edildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            try
            {
                await _userService.SendPasswordResetCodeAsync(request.Email);
                return Ok(new { message = "Şifre sıfırlama kodu e-posta adresinize gönderildi" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            try
            {
                await _userService.ResetPasswordAsync(request.Email, request.Code, request.NewPassword);
                return Ok(new { message = "Şifreniz başarıyla sıfırlandı" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto request)
        {
            try
            {
                var authResponse = await _userService.GoogleLoginAsync(request.Token);
                return Ok(new { 
                    message = "Google girişi başarılı", 
                    data = authResponse
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("delete-account")]
        [Authorize]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _userService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound(new { message = "Kullanıcı bulunamadı" });
                }

                // Verify current password
                var isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                if (!isValidPassword)
                {
                    return BadRequest(new { message = "Mevcut şifre hatalı" });
                }

                await _userService.DeleteUserAsync(userId);
                
                return Ok(new { message = "Hesap başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("privacy-settings")]
        [Authorize]
        public async Task<IActionResult> UpdatePrivacySettings([FromBody] UpdatePrivacySettingsDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                var updateData = new UpdateUserDto
                {
                    IsProfileVisible = request.IsProfileVisible,
                    IsActivityStatusVisible = request.IsActivityStatusVisible,
                    IsGameListVisible = request.IsGameListVisible
                };

                var updatedUser = await _userService.UpdateUserAsync(userId, updateData);

                return Ok(new { 
                    message = "Gizlilik ayarları güncellendi", 
                    data = new 
                    {
                        IsProfileVisible = updatedUser.IsProfileVisible,
                        IsActivityStatusVisible = updatedUser.IsActivityStatusVisible,
                        IsGameListVisible = updatedUser.IsGameListVisible
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("send-verification-email")]
        [Authorize]
        public async Task<IActionResult> SendVerificationEmail()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _userService.SendEmailVerificationAsync(userId);

                return Ok(new { message = "Email doğrulama linki gönderildi" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("verify-email-token")]
        public async Task<IActionResult> VerifyEmailWithToken([FromBody] VerifyEmailDto request)
        {
            try
            {
                await _userService.VerifyEmailWithTokenAsync(request.Token);
                return Ok(new { message = "Email başarıyla doğrulandı!" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("test-auth")]
        [Authorize]
        public ActionResult TestAuth()
        {
            try
            {
                var authHeader = Request.Headers.Authorization.FirstOrDefault();
                var currentUserId = GetCurrentUserId();
                var userClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                
                return Ok(new { 
                    message = "Auth test successful", 
                    userId = currentUserId,
                    authHeader = authHeader,
                    isAuthenticated = User.Identity?.IsAuthenticated == true,
                    claims = userClaims
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Auth test failed", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            // Try different claim types
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
                           ?? User.FindFirst("sub") 
                           ?? User.FindFirst("userId") 
                           ?? User.FindFirst("id");
            
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("User ID not found in token");
        }
    }

}