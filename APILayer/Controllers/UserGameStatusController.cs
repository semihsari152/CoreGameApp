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
    public class UserGameStatusController : ControllerBase
    {
        private readonly IUserGameStatusService _userGameStatusService;

        public UserGameStatusController(IUserGameStatusService userGameStatusService)
        {
            _userGameStatusService = userGameStatusService;
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<UserGameStatusDto>>> GetUserGameStatuses(int userId)
        {
            try
            {
                var statuses = await _userGameStatusService.GetUserGameStatusesAsync(userId);
                return Ok(new { message = "Kullanıcı oyun durumları", data = statuses });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}/status/{status}")]
        public async Task<ActionResult<IEnumerable<UserGameStatusDto>>> GetGamesByStatus(int userId, GameListType status)
        {
            try
            {
                var games = await _userGameStatusService.GetGamesByStatusAsync(userId, status);
                return Ok(new { message = $"Kullanıcının {status} durumundaki oyunları", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}/game/{gameId}")]
        public async Task<ActionResult<UserGameStatusDto>> GetUserGameStatus(int userId, int gameId)
        {
            try
            {
                var status = await _userGameStatusService.GetUserGameStatusAsync(userId, gameId);
                if (status == null)
                {
                    return NotFound(); // Sessizce 404 döndür, mesaj gösterme
                }

                return Ok(new { message = "Kullanıcı oyun durumu", data = status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOrUpdateUserGameStatus([FromBody] CreateUserGameStatusDto createDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _userGameStatusService.CreateOrUpdateUserGameStatusAsync(userId, createDto);
                
                return Ok(new { message = "Oyun durumu başarıyla güncellendi", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("game/{gameId}")]
        [Authorize]
        public async Task<IActionResult> UpdateUserGameStatus(int gameId, [FromBody] UpdateUserGameStatusDto updateDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _userGameStatusService.UpdateUserGameStatusAsync(userId, gameId, updateDto);
                
                return Ok(new { message = "Oyun durumu güncellendi", data = result });
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

        [HttpDelete("game/{gameId}")]
        [Authorize]
        public async Task<IActionResult> RemoveUserGameStatus(int gameId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _userGameStatusService.RemoveUserGameStatusAsync(userId, gameId);
                
                return Ok(new { message = "Oyun durumu silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("check/game/{gameId}")]
        [Authorize]
        public async Task<ActionResult<bool>> CheckUserHasGameStatus(int gameId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var hasStatus = await _userGameStatusService.UserHasGameStatusAsync(userId, gameId);
                
                return Ok(new { message = "Durum kontrolü", data = hasStatus });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("my-games")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<UserGameStatusDto>>> GetMyGameStatuses()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var statuses = await _userGameStatusService.GetUserGameStatusesAsync(userId);
                
                return Ok(new { message = "Oyun durumlarım", data = statuses });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("my-games/{status}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<UserGameStatusDto>>> GetMyGamesByStatus(GameListType status)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var games = await _userGameStatusService.GetGamesByStatusAsync(userId, status);
                
                return Ok(new { message = $"{status} durumundaki oyunlarım", data = games });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}