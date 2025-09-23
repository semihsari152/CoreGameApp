using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InfrastructureLayer.Data;
using DomainLayer.Enums;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatisticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("likes/{likableType}/{entityId}")]
        public async Task<IActionResult> GetLikeCounts(LikableType likableType, int entityId)
        {
            try
            {
                var likeCount = await _context.Likes
                    .Where(l => l.LikableType == likableType && l.TargetEntityId == entityId && l.IsLike == true)
                    .CountAsync();

                var dislikeCount = await _context.Likes
                    .Where(l => l.LikableType == likableType && l.TargetEntityId == entityId && l.IsLike == false)
                    .CountAsync();

                return Ok(new
                {
                    message = "Like counts retrieved successfully",
                    data = new { likeCount, dislikeCount }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving like counts", error = ex.Message });
            }
        }

        [HttpGet("comments/{commentableType}/{entityId}")]
        public async Task<IActionResult> GetCommentCount(CommentableType commentableType, int entityId)
        {
            try
            {
                var count = await _context.Comments
                    .Where(c => c.CommentableType == commentableType && c.TargetEntityId == entityId)
                    .CountAsync();

                return Ok(new
                {
                    message = "Comment count retrieved successfully",
                    data = new { count }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving comment count", error = ex.Message });
            }
        }

        [HttpGet("entity/{likableType}/{commentableType}/{entityId}")]
        public async Task<IActionResult> GetEntityStats(LikableType likableType, CommentableType commentableType, int entityId)
        {
            try
            {
                var likeCount = await _context.Likes
                    .Where(l => l.LikableType == likableType && l.TargetEntityId == entityId && l.IsLike == true)
                    .CountAsync();

                var dislikeCount = await _context.Likes
                    .Where(l => l.LikableType == likableType && l.TargetEntityId == entityId && l.IsLike == false)
                    .CountAsync();

                var commentCount = await _context.Comments
                    .Where(c => c.CommentableType == commentableType && c.TargetEntityId == entityId)
                    .CountAsync();

                return Ok(new
                {
                    message = "Entity statistics retrieved successfully",
                    data = new { likeCount, dislikeCount, commentCount }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving entity statistics", error = ex.Message });
            }
        }

        [HttpPost("batch")]
        public async Task<IActionResult> GetBatchStats([FromBody] BatchStatsRequest request)
        {
            try
            {
                var results = new Dictionary<int, EntityStats>();

                foreach (var req in request.Requests)
                {
                    var likeCount = await _context.Likes
                        .Where(l => l.LikableType == req.LikableType && l.TargetEntityId == req.EntityId && l.IsLike == true)
                        .CountAsync();

                    var dislikeCount = await _context.Likes
                        .Where(l => l.LikableType == req.LikableType && l.TargetEntityId == req.EntityId && l.IsLike == false)
                        .CountAsync();

                    var commentCount = await _context.Comments
                        .Where(c => c.CommentableType == req.CommentableType && c.TargetEntityId == req.EntityId)
                        .CountAsync();

                    results[req.EntityId] = new EntityStats
                    {
                        LikeCount = likeCount,
                        DislikeCount = dislikeCount,
                        CommentCount = commentCount
                    };
                }

                return Ok(new
                {
                    message = "Batch statistics retrieved successfully",
                    data = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving batch statistics", error = ex.Message });
            }
        }
    }

    public class BatchStatsRequest
    {
        public List<EntityStatsRequest> Requests { get; set; } = new();
    }

    public class EntityStatsRequest
    {
        public LikableType LikableType { get; set; }
        public CommentableType CommentableType { get; set; }
        public int EntityId { get; set; }
    }

    public class EntityStats
    {
        public int LikeCount { get; set; }
        public int DislikeCount { get; set; }
        public int CommentCount { get; set; }
    }
}