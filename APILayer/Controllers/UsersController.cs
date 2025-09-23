using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Enums;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly INotificationService _notificationService;

        public UsersController(IUserService userService, INotificationService notificationService)
        {
            _userService = userService;
            _notificationService = notificationService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            // Send profile view notification if user is authenticated and not viewing their own profile
            if (User.Identity?.IsAuthenticated == true)
            {
                var viewerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(viewerIdClaim, out int viewerId) && viewerId != id)
                {
                    try
                    {
                        await _notificationService.NotifyProfileViewAsync(id, viewerId);
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail the request
                        Console.WriteLine($"Failed to send profile view notification: {ex.Message}");
                    }
                }
            }

            return Ok(user);
        }

        [HttpGet("username/{username}")]
        public async Task<ActionResult<UserDto>> GetUserByUsername(string username)
        {
            var user = await _userService.GetUserByUsernameAsync(username);
            if (user == null)
                return NotFound();

            // Send profile view notification if user is authenticated and not viewing their own profile
            if (User.Identity?.IsAuthenticated == true)
            {
                var viewerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(viewerIdClaim, out int viewerId) && viewerId != user.Id)
                {
                    try
                    {
                        await _notificationService.NotifyProfileViewAsync(user.Id, viewerId);
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail the request
                        Console.WriteLine($"Failed to send profile view notification: {ex.Message}");
                    }
                }
            }

            return Ok(user);
        }

        [HttpGet("email/{email}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<UserDto>> GetUserByEmail(string email)
        {
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetActiveUsers()
        {
            var users = await _userService.GetActiveUsersAsync();
            return Ok(users);
        }

        [HttpGet("role/{role}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersByRole(UserRole role)
        {
            var users = await _userService.GetUsersByRoleAsync(role);
            return Ok(users);
        }

        [HttpGet("top-by-xp/{count}")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetTopUsersByXP(int count)
        {
            var users = await _userService.GetTopUsersByXPAsync(count);
            return Ok(users);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createUserDto)
        {
            if (await _userService.IsUsernameExistsAsync(createUserDto.Username))
                return BadRequest("Bu kullanıcı adı zaten kullanılıyor.");

            if (await _userService.IsEmailExistsAsync(createUserDto.Email))
                return BadRequest("Bu e-posta adresi zaten kullanılıyor.");

            var user = await _userService.CreateUserAsync(createUserDto);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            var user = await _userService.UpdateUserAsync(id, updateUserDto);
            return Ok(user);
        }


        [HttpPost("{id}/verify-email")]
        [Authorize]
        public async Task<IActionResult> VerifyEmail(int id)
        {
            await _userService.VerifyEmailAsync(id);
            return Ok();
        }

        [HttpPost("{id}/update-xp")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UpdateUserXP(int id, [FromBody] int xpAmount)
        {
            await _userService.UpdateUserXPAsync(id, xpAmount);
            return Ok();
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            await _userService.ChangePasswordAsync(changePasswordDto.UserId, 
                changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
            return Ok();
        }

        [HttpGet("check-username/{username}")]
        public async Task<ActionResult<bool>> CheckUsernameExists(string username)
        {
            var exists = await _userService.IsUsernameExistsAsync(username);
            return Ok(exists);
        }

        [HttpGet("check-email/{email}")]
        public async Task<ActionResult<bool>> CheckEmailExists(string email)
        {
            var exists = await _userService.IsEmailExistsAsync(email);
            return Ok(exists);
        }

        [HttpGet("{id}/stats")]
        public async Task<ActionResult<UserStatsDto>> GetUserStats(int id)
        {
            var stats = await _userService.GetUserStatsAsync(id);
            if (stats == null)
                return NotFound();

            return Ok(stats);
        }

        [HttpGet("{id}/test")]
        public async Task<ActionResult<string>> GetTest(int id)
        {
            return Ok("Test successful for user " + id);
        }

        [HttpGet("{id}/activity")]
        public async Task<ActionResult<IEnumerable<UserActivityDto>>> GetUserActivity(int id)
        {
            var activities = await _userService.GetUserActivityAsync(id);
            return Ok(activities);
        }

        [HttpGet("{id}/game-ratings")]
        public async Task<ActionResult<IEnumerable<GameRatingDto>>> GetUserGameRatings(int id)
        {
            var ratings = await _userService.GetUserGameRatingsAsync(id);
            return Ok(ratings);
        }

        [HttpGet("{id}/forum-posts")]
        public async Task<ActionResult<IEnumerable<ForumTopicDto>>> GetUserForumPosts(int id)
        {
            var forumPosts = await _userService.GetUserForumPostsAsync(id);
            return Ok(forumPosts);
        }

        [HttpGet("{id}/blogs")]
        public async Task<ActionResult<IEnumerable<BlogPostDto>>> GetUserBlogs(int id)
        {
            var blogs = await _userService.GetUserBlogsAsync(id);
            return Ok(blogs);
        }

        [HttpGet("{id}/guides")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> GetUserGuides(int id)
        {
            var guides = await _userService.GetUserGuidesAsync(id);
            return Ok(guides);
        }

        [HttpGet("{id}/game-statuses")]
        public async Task<ActionResult<IEnumerable<UserGameStatusDto>>> GetUserGameStatuses(int id)
        {
            var gameStatuses = await _userService.GetUserGameStatusesAsync(id);
            return Ok(gameStatuses);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateUserDto updateUserDto)
        {
            // Try different claim names for user ID
            var userIdClaim = User.FindFirst("userId")?.Value ?? 
                             User.FindFirst("sub")?.Value ?? 
                             User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
            var userId = int.Parse(userIdClaim);
            
            if (userId == 0)
                return Unauthorized("Kullanıcı kimliği alınamadı.");

            // If username is being updated, check if it already exists
            if (!string.IsNullOrEmpty(updateUserDto.Username))
            {
                var currentUser = await _userService.GetUserByIdAsync(userId);
                if (currentUser == null)
                    return NotFound("Kullanıcı bulunamadı.");

                // Only check if username is different from current username
                if (updateUserDto.Username != currentUser.Username)
                {
                    var usernameExists = await _userService.IsUsernameExistsAsync(updateUserDto.Username);
                    if (usernameExists)
                        return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor." });
                }
            }

            // If this is a profile setup completion from OAuth, mark as no longer new user
            if (!string.IsNullOrEmpty(updateUserDto.Username))
            {
                updateUserDto.IsNewUser = false;
            }

            var user = await _userService.UpdateUserAsync(userId, updateUserDto);
            return Ok(user);
        }

        // Admin Management Endpoints

        [HttpPost("{id}/toggle-status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ToggleUserStatus(int id)
        {
            var currentUserId = int.Parse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.GetUserByIdAsync(id);
            
            if (user == null)
                return NotFound("Kullanıcı bulunamadı");

            var updatedUser = await _userService.ToggleUserStatusAsync(id);
            return Ok(new { Message = $"Kullanıcı {(updatedUser.IsActive ? "aktif" : "pasif")} edildi" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            var currentUserId = int.Parse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            if (id == currentUserId)
                return BadRequest("Kendi hesabınızı silemezsiniz");

            var success = await _userService.DeleteUserAsync(id);
            if (!success)
                return NotFound("Kullanıcı bulunamadı");

            return Ok(new { Message = "Kullanıcı silindi" });
        }

        [HttpPost("{id}/make-admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> MakeUserAdmin(int id)
        {
            var updatedUser = await _userService.UpdateUserRoleAsync(id, UserRole.Admin);
            if (updatedUser == null)
                return NotFound("Kullanıcı bulunamadı");

            return Ok(new { Message = "Kullanıcıya admin yetkisi verildi" });
        }

        [HttpPost("{id}/remove-admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RemoveUserAdmin(int id)
        {
            var currentUserId = int.Parse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            if (id == currentUserId)
                return BadRequest("Kendi admin yetkilerinizi kaldıramazsınız");

            var updatedUser = await _userService.UpdateUserRoleAsync(id, UserRole.User);
            if (updatedUser == null)
                return NotFound("Kullanıcı bulunamadı");

            return Ok(new { Message = "Admin yetkisi kaldırıldı" });
        }
    }

}