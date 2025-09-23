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
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoriteService _favoriteService;

        public FavoritesController(IFavoriteService favoriteService)
        {
            _favoriteService = favoriteService;
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<FavoriteDto>>> GetUserFavorites(int userId, [FromQuery] FavoriteType? favoriteType = null)
        {
            try
            {
                var favorites = await _favoriteService.GetUserFavoritesAsync(userId, favoriteType);
                return Ok(new { message = "Kullanıcı favorileri", data = favorites });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}/entity/{favoriteType}/{entityId}")]
        public async Task<ActionResult<FavoriteDto>> GetUserFavorite(int userId, FavoriteType favoriteType, int entityId)
        {
            try
            {
                var favorite = await _favoriteService.GetUserFavoriteAsync(userId, favoriteType, entityId);
                if (favorite == null)
                {
                    return NotFound(new { message = "Favori bulunamadı" });
                }

                return Ok(new { message = "Favori detayı", data = favorite });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateFavorite([FromBody] CreateFavoriteDto createDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                // Check if already favorited
                var existing = await _favoriteService.GetUserFavoriteAsync(userId, createDto.FavoriteType, createDto.TargetEntityId);
                if (existing != null)
                {
                    return BadRequest(new { message = "Bu öğe zaten favorilerde" });
                }

                var favorite = await _favoriteService.CreateFavoriteAsync(userId, createDto);
                return Ok(new { message = "Favorilere eklendi", data = favorite });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("entity/{favoriteType}/{entityId}")]
        [Authorize]
        public async Task<IActionResult> RemoveFavorite(FavoriteType favoriteType, int entityId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _favoriteService.RemoveFavoriteAsync(userId, favoriteType, entityId);
                
                if (!result)
                {
                    return NotFound(new { message = "Favori bulunamadı" });
                }

                return Ok(new { message = "Favorilerden kaldırıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("toggle")]
        [Authorize]
        public async Task<IActionResult> ToggleFavorite([FromBody] CreateFavoriteDto toggleDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _favoriteService.ToggleFavoriteAsync(userId, toggleDto.FavoriteType, toggleDto.TargetEntityId);
                
                return Ok(new { 
                    message = result.IsFavorited ? "Favorilere eklendi" : "Favorilerden kaldırıldı", 
                    data = new { isFavorited = result.IsFavorited } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<FavoriteDto>>> GetMyFavorites([FromQuery] FavoriteType? favoriteType = null)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var favorites = await _favoriteService.GetUserFavoritesAsync(userId, favoriteType);
                
                return Ok(new { message = "Favorilerim", data = favorites });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("check/{favoriteType}/{entityId}")]
        [Authorize]
        public async Task<ActionResult<bool>> CheckIfFavorited(FavoriteType favoriteType, int entityId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var favorite = await _favoriteService.GetUserFavoriteAsync(userId, favoriteType, entityId);
                
                return Ok(new { message = "Favori kontrolü", data = favorite != null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}