using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Enums;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LikesController : ControllerBase
    {
        private readonly ILikeService _likeService;

        public LikesController(ILikeService likeService)
        {
            _likeService = likeService;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LikeDto>> GetLike(int id)
        {
            var like = await _likeService.GetLikeByIdAsync(id);
            if (like == null)
                return NotFound();

            return Ok(like);
        }

        [HttpGet("entity/{type}/{entityId}")]
        public async Task<ActionResult<IEnumerable<LikeDto>>> GetLikesByEntity(LikableType type, int entityId)
        {
            var likes = await _likeService.GetLikesByEntityAsync(type, entityId);
            return Ok(likes);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<LikeDto>>> GetLikesByUser(int userId)
        {
            var likes = await _likeService.GetLikesByUserAsync(userId);
            return Ok(likes);
        }

        [HttpGet("userlike/{userId}/entity/{type}/{entityId}")]
        public async Task<ActionResult<LikeDto>> GetUserLike(int userId, LikableType type, int entityId)
        {
            var like = await _likeService.GetUserLikeAsync(userId, type, entityId);
            if (like == null)
                return NotFound(); // Sessizce 404 döndür, mesaj gösterme

            return Ok(new { data = like, message = "Kullanıcı beğenisi" });
        }

        [HttpGet("count/{type}/{entityId}")]
        public async Task<ActionResult<object>> GetLikeCounts(LikableType type, int entityId, [FromQuery] bool? isLike = null)
        {
            if (isLike.HasValue)
            {
                var count = await _likeService.GetLikeCountAsync(type, entityId, isLike.Value);
                return Ok(new { count });
            }

            var stats = await _likeService.GetLikeStatsAsync(type, entityId);
            return Ok(new { data = stats, message = "Like istatistikleri" });
        }

        [HttpGet("check/{userId}/{type}/{entityId}")]
        public async Task<ActionResult<bool>> HasUserLiked(int userId, LikableType type, int entityId)
        {
            var hasLiked = await _likeService.HasUserLikedAsync(userId, type, entityId);
            return Ok(hasLiked);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<LikeDto>> CreateLike(CreateLikeDto createLikeDto)
        {
            var like = await _likeService.CreateLikeAsync(createLikeDto);
            return CreatedAtAction(nameof(GetLike), new { id = like.Id }, like);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteLike(int id)
        {
            await _likeService.DeleteLikeAsync(id);
            return NoContent();
        }

        [HttpPost("toggle")]
        [Authorize]
        public async Task<IActionResult> ToggleLike([FromBody] ToggleLikeDto toggleLikeDto)
        {
            await _likeService.ToggleLikeAsync(toggleLikeDto.UserId, toggleLikeDto.Type, 
                toggleLikeDto.EntityId, toggleLikeDto.IsLike);
            return Ok();
        }
    }

    public class ToggleLikeDto
    {
        public int UserId { get; set; }
        public LikableType Type { get; set; }
        public int EntityId { get; set; }
        public bool IsLike { get; set; }
    }
}