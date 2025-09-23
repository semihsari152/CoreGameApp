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
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IValidator<CreateCommentDto> _createCommentValidator;

        public CommentsController(ICommentService commentService, IValidator<CreateCommentDto> createCommentValidator)
        {
            _commentService = commentService;
            _createCommentValidator = createCommentValidator;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCommentById(int id)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                {
                    return NotFound(new { message = "Yorum bulunamadı" });
                }

                return Ok(new { message = "Yorum detayları", data = comment });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("entity/{commentableType}/{entityId}")]
        public async Task<IActionResult> GetCommentsByEntity(CommentableType commentableType, int entityId)
        {
            try
            {
                // Get current user ID if authenticated
                int? currentUserId = null;
                if (User.Identity?.IsAuthenticated == true)
                {
                    currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                }

                var comments = await _commentService.GetCommentsByEntityAsync(commentableType, entityId, currentUserId);
                return Ok(new { message = "Yorumlar listelendi", data = comments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetCommentsByUser(int userId)
        {
            try
            {
                var comments = await _commentService.GetCommentsByUserAsync(userId);
                return Ok(new { message = "Kullanıcı yorumları", data = comments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("entity/{commentableType}/{entityId}/count")]
        public async Task<IActionResult> GetCommentsCount(CommentableType commentableType, int entityId)
        {
            try
            {
                var count = await _commentService.GetCommentsCountAsync(commentableType, entityId);
                return Ok(new { message = "Yorum sayısı", data = new { count } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto createCommentDto)
        {
            var validationResult = await _createCommentValidator.ValidateAsync(createCommentDto);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { 
                    message = "Validation failed", 
                    errors = validationResult.Errors.Select(e => e.ErrorMessage) 
                });
            }

            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var comment = await _commentService.CreateCommentAsync(userId, createCommentDto);
                
                return CreatedAtAction(nameof(GetCommentById), new { id = comment.Id }, 
                    new { message = "Yorum oluşturuldu", data = comment });
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

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDto updateCommentDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var comment = await _commentService.UpdateCommentAsync(id, userId, updateCommentDto);
                
                return Ok(new { message = "Yorum güncellendi", data = comment });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.DeleteCommentAsync(id, userId);
                
                if (!result)
                {
                    return NotFound(new { message = "Yorum bulunamadı" });
                }

                return Ok(new { message = "Yorum silindi" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/like")]
        [Authorize]
        public async Task<IActionResult> LikeComment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.LikeCommentAsync(id, userId);
                
                return Ok(new { 
                    message = result ? "Yorum beğenildi" : "Beğeni kaldırıldı", 
                    isLiked = result 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}/like")]
        [Authorize]
        public async Task<IActionResult> UnlikeComment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.UnlikeCommentAsync(id, userId);
                
                if (!result)
                {
                    return BadRequest(new { message = "Beğeni kaldırılamadı" });
                }

                return Ok(new { message = "Beğeni kaldırıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/dislike")]
        [Authorize]
        public async Task<IActionResult> DislikeComment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.DislikeCommentAsync(id, userId);
                
                return Ok(new { 
                    message = result ? "Yorum beğenilmedi" : "Beğenilmeme kaldırıldı", 
                    isDisliked = result 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}/dislike")]
        [Authorize]
        public async Task<IActionResult> UndislikeComment(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.UndislikeCommentAsync(id, userId);
                
                if (!result)
                {
                    return BadRequest(new { message = "Beğenilmeme kaldırılamadı" });
                }

                return Ok(new { message = "Beğenilmeme kaldırıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/sticky")]
        [Authorize]
        public async Task<IActionResult> ToggleSticky(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.ToggleStickyAsync(id, userId);
                
                return Ok(new { message = result ? "Yorum sabitlendi" : "Yorum sabitlemesi kaldırıldı", data = new { isSticky = result } });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
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

        [HttpPost("{id}/best-answer")]
        [Authorize]
        public async Task<IActionResult> ToggleBestAnswer(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _commentService.ToggleBestAnswerAsync(id, userId);
                
                return Ok(new { message = result ? "En iyi cevap olarak işaretlendi" : "En iyi cevap işareti kaldırıldı", data = new { isBestAnswer = result } });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
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
    }
}