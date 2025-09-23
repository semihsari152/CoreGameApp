using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ApplicationLayer.Services;
using ApplicationLayer.DTOs;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameRatingController : ControllerBase
    {
        private readonly IGameRatingService _gameRatingService;

        public GameRatingController(IGameRatingService gameRatingService)
        {
            _gameRatingService = gameRatingService;
        }

        [HttpGet("user/game/{gameId}")]
        [Authorize]
        public async Task<IActionResult> GetUserRating(int gameId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var rating = await _gameRatingService.GetUserRatingAsync(userId, gameId);
                
                if (rating == null)
                {
                    return NotFound(new { message = "Kullanıcı bu oyunu puanlamamış" });
                }

                return Ok(new { message = "Kullanıcı puanı", data = rating });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("distribution/game/{gameId}")]
        public async Task<IActionResult> GetRatingDistribution(int gameId)
        {
            try
            {
                var distribution = await _gameRatingService.GetRatingStatsAsync(gameId);
                return Ok(new { message = "Oyun puan dağılımı", data = distribution });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("game/{gameId}")]
        [Authorize]
        public async Task<IActionResult> RateGame(int gameId, [FromBody] RateGameDto rateGameDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                // Check if user already rated this game
                var existingRating = await _gameRatingService.GetUserRatingAsync(userId, gameId);
                if (existingRating != null)
                {
                    // Update existing rating
                    var updateDto = new UpdateGameRatingDto 
                    { 
                        Rating = rateGameDto.Rating, 
                        Review = rateGameDto.Review 
                    };
                    var updatedRating = await _gameRatingService.UpdateGameRatingAsync(existingRating.Id, updateDto);
                    return Ok(new { message = "Oyun puanı güncellendi", data = updatedRating });
                }
                else
                {
                    // Create new rating
                    var createDto = new CreateGameRatingDto
                    {
                        UserId = userId,
                        GameId = gameId,
                        Rating = rateGameDto.Rating,
                        Review = rateGameDto.Review
                    };
                    var newRating = await _gameRatingService.CreateGameRatingAsync(createDto);
                    return Ok(new { message = "Oyun puanlandı", data = newRating });
                }
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}