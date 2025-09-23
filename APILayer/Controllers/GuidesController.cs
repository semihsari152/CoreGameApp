using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using ApplicationLayer.Utils;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GuidesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly AppDbContext _context;
        private readonly IGuideService _guideService;

        public GuidesController(IUnitOfWork unitOfWork, AppDbContext context, IGuideService guideService)
        {
            _unitOfWork = unitOfWork;
            _context = context;
            _guideService = guideService;
        }

        [HttpGet]
        public async Task<IActionResult> GetGuides([FromQuery] int page = 1, [FromQuery] int pageSize = 12, [FromQuery] string? searchTerm = null, [FromQuery] string? sortBy = "latest", [FromQuery] int? gameId = null, [FromQuery] int? categoryId = null, [FromQuery] string? difficulty = null)
        {
            try
            {
                var query = _context.Guides
                    .Include(g => g.User)
                    .Include(g => g.Game)
                    .Include(g => g.GuideCategory)
                    .Where(g => g.IsPublished)
                    .AsQueryable();

                // Apply search filter
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(g => g.Title.Contains(searchTerm) || (g.Summary != null && g.Summary.Contains(searchTerm)));
                }

                // Apply game filter
                if (gameId.HasValue)
                {
                    query = query.Where(g => g.GameId == gameId.Value);
                }

                // Apply category filter
                if (categoryId.HasValue)
                {
                    query = query.Where(g => g.GuideCategoryId == categoryId.Value);
                }

                // Apply difficulty filter
                if (!string.IsNullOrEmpty(difficulty))
                {
                    query = query.Where(g => g.Difficulty == difficulty);
                }

                // Apply sorting
                query = sortBy?.ToLower() switch
                {
                    "latest" => query.OrderByDescending(g => g.CreatedDate),
                    "popular" => query.OrderByDescending(g => g.ViewCount),
                    "rating" => query.OrderByDescending(g => g.AverageRating),
                    _ => query.OrderByDescending(g => g.CreatedDate)
                };

                var totalCount = await query.CountAsync();
                var guides = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(g => new
                    {
                        g.Id,
                        g.Title,
                        g.Slug,
                        Summary = g.Summary ?? "",
                        g.ViewCount,
                        AverageRating = g.AverageRating,
                        RatingCount = g.RatingCount,
                        CreatedDate = g.CreatedDate,
                        UpdatedDate = g.UpdatedDate,
                        g.Difficulty,
                        GuideCategoryId = g.GuideCategoryId,
                        GuideCategory = g.GuideCategory != null ? new
                        {
                            g.GuideCategory.Id,
                            g.GuideCategory.Name,
                            g.GuideCategory.IconClass
                        } : null,
                        Tags = new string[] { }, // Will be populated later with actual tags
                        User = new
                        {
                            g.User.Id,
                            g.User.Username,
                            AvatarUrl = g.User.AvatarUrl
                        },
                        Game = g.Game != null ? new
                        {
                            g.Game.Id,
                            g.Game.Name,
                            CoverImageUrl = g.Game.CoverImageUrl
                        } : null,
                        ThumbnailUrl = g.ThumbnailUrl,
                        g.IsPublished,
                        g.IsFeatured
                    })
                    .ToListAsync();

                return Ok(new { 
                    message = "Kılavuzlar listelendi", 
                    data = guides,
                    totalCount = totalCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetGuideBySlug(string slug)
        {
            try
            {
                var guide = await _context.Guides
                    .Include(g => g.User)
                    .Include(g => g.Game)
                    .Include(g => g.GuideCategory)
                    .Include(g => g.GuideTags)
                        .ThenInclude(gt => gt.Tag)
                    .Include(g => g.GuideBlocks)
                    .FirstOrDefaultAsync(g => g.Slug == slug);

                if (guide == null)
                    return NotFound(new { message = "Kılavuz bulunamadı" });

                // Increment view count
                guide.ViewCount++;
                _context.Guides.Update(guide);
                await _context.SaveChangesAsync();

                var guideDetail = new
                {
                    guide.Id,
                    guide.Title,
                    guide.Slug,
                    guide.Summary,
                    guide.Difficulty,
                    guide.ViewCount,
                    guide.AverageRating,
                    guide.RatingCount,
                    guide.CreatedDate,
                    guide.UpdatedDate,
                    guide.ThumbnailUrl, // Frontend için direkt field
                    guide.GameId, // Frontend için direkt field  
                    guide.GuideCategoryId, // Frontend için direkt field
                    guide.UserId, // Frontend için direkt field
                    Tags = guide.GuideTags.Select(gt => gt.Tag.Name).ToList(),
                    GuideBlocks = guide.GuideBlocks.OrderBy(gb => gb.Order).Select(gb => new
                    {
                        gb.Id,
                        gb.BlockType,
                        gb.Order,
                        gb.Title,
                        gb.Content,
                        gb.MediaUrl,
                        gb.Caption,
                        gb.Metadata
                    }).ToList(),
                    Author = new
                    {
                        guide.User.Id,
                        guide.User.Username,
                        guide.User.AvatarUrl
                    },
                    Game = guide.Game != null ? new
                    {
                        guide.Game.Id,
                        guide.Game.Name,
                        guide.Game.Slug,
                        guide.Game.CoverImageUrl
                    } : null,
                    GuideCategory = guide.GuideCategory != null ? new
                    {
                        guide.GuideCategory.Id,
                        guide.GuideCategory.Name,
                        guide.GuideCategory.IconClass
                    } : null
                };

                return Ok(new { message = "Kılavuz detayları", data = guideDetail });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGuide(int id)
        {
            try
            {
                var guide = await _context.Guides
                    .Include(g => g.User)
                    .Include(g => g.Game)
                    .Include(g => g.GuideCategory)
                    .Include(g => g.GuideTags)
                        .ThenInclude(gt => gt.Tag)
                    .Include(g => g.GuideBlocks)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (guide == null)
                    return NotFound(new { message = "Kılavuz bulunamadı" });

                // Increment view count
                guide.ViewCount++;
                _context.Guides.Update(guide);
                await _context.SaveChangesAsync();

                var guideDetail = new
                {
                    guide.Id,
                    guide.Title,
                    guide.Slug,
                    guide.Summary,
                    guide.Difficulty,
                    guide.ViewCount,
                    guide.AverageRating,
                    guide.RatingCount,
                    guide.CreatedDate,
                    guide.UpdatedDate,
                    guide.ThumbnailUrl, // Frontend için direkt field
                    guide.GameId, // Frontend için direkt field  
                    guide.GuideCategoryId, // Frontend için direkt field
                    guide.UserId, // Frontend için direkt field
                    Tags = guide.GuideTags.Select(gt => gt.Tag.Name).ToList(),
                    GuideBlocks = guide.GuideBlocks.OrderBy(gb => gb.Order).Select(gb => new
                    {
                        gb.Id,
                        gb.BlockType,
                        gb.Order,
                        gb.Title,
                        gb.Content,
                        gb.MediaUrl,
                        gb.Caption,
                        gb.Metadata
                    }).ToList(),
                    Author = new
                    {
                        guide.User.Id,
                        guide.User.Username,
                        guide.User.AvatarUrl
                    },
                    Game = guide.Game != null ? new
                    {
                        guide.Game.Id,
                        guide.Game.Name,
                        guide.Game.Slug,
                        guide.Game.CoverImageUrl
                    } : null,
                    GuideCategory = guide.GuideCategory != null ? new
                    {
                        guide.GuideCategory.Id,
                        guide.GuideCategory.Name,
                        guide.GuideCategory.IconClass
                    } : null
                };

                return Ok(new { message = "Kılavuz detayları", data = guideDetail });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("game/{gameId}")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> GetGuidesByGame(int gameId)
        {
            var guides = await _guideService.GetGuidesByGameAsync(gameId);
            return Ok(guides);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> GetGuidesByUser(int userId)
        {
            var guides = await _guideService.GetGuidesByUserAsync(userId);
            return Ok(guides);
        }

        [HttpGet("published")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> GetPublishedGuides()
        {
            var guides = await _guideService.GetPublishedGuidesAsync();
            return Ok(guides);
        }

        [HttpGet("top-rated/{count}")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> GetTopRatedGuides(int count)
        {
            var guides = await _guideService.GetTopRatedGuidesAsync(count);
            return Ok(guides);
        }

        [HttpGet("recent/{count}")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> GetRecentGuides(int count)
        {
            var guides = await _guideService.GetRecentGuidesAsync(count);
            return Ok(guides);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<GuideDto>>> SearchGuides([FromQuery] string searchTerm)
        {
            var guides = await _guideService.SearchGuidesAsync(searchTerm);
            return Ok(guides);
        }

        [HttpPost]
        // [Authorize] // Temporarily disabled for testing
        public async Task<ActionResult<GuideDto>> CreateGuide(CreateGuideDto createGuideDto)
        {
            try
            {
                // For testing: use provided userId or default to 2 (voopie)
                if (createGuideDto.UserId == 0)
                {
                    createGuideDto.UserId = 2; // Default to voopie user for testing
                }

                var guide = await _guideService.CreateGuideAsync(createGuideDto);
                return Ok(new { message = "Rehber başarıyla oluşturuldu", data = guide });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Rehber oluşturulurken hata oluştu", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<GuideDto>> UpdateGuide(int id, UpdateGuideDto updateGuideDto)
        {
            var guide = await _guideService.UpdateGuideAsync(id, updateGuideDto);
            return Ok(guide);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteGuide(int id)
        {
            await _guideService.DeleteGuideAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/publish")]
        [Authorize]
        public async Task<IActionResult> PublishGuide(int id)
        {
            await _guideService.PublishGuideAsync(id);
            return Ok();
        }

        [HttpPost("{id}/unpublish")]
        [Authorize]
        public async Task<IActionResult> UnpublishGuide(int id)
        {
            await _guideService.UnpublishGuideAsync(id);
            return Ok();
        }

        [HttpGet("{id}/similar")]
        public async Task<IActionResult> GetSimilarGuides(int id, [FromQuery] int count = 4)
        {
            try
            {
                var currentGuide = await _context.Guides
                    .Include(g => g.GuideCategory)
                    .FirstOrDefaultAsync(g => g.Id == id);

                if (currentGuide == null)
                    return NotFound(new { message = "Kılavuz bulunamadı" });

                var similarGuides = await _context.Guides
                    .Include(g => g.User)
                    .Include(g => g.Game)
                    .Include(g => g.GuideCategory)
                    .Where(g => g.Id != id && g.IsPublished && 
                           (g.GameId == currentGuide.GameId || 
                            g.GuideCategoryId == currentGuide.GuideCategoryId))
                    .OrderByDescending(g => g.ViewCount)
                    .Take(count)
                    .Select(g => new
                    {
                        g.Id,
                        g.Title,
                        g.Summary,
                        g.ViewCount,
                        g.Difficulty,
                        g.CreatedDate,
                        User = new
                        {
                            g.User.Id,
                            g.User.Username,
                            g.User.AvatarUrl
                        },
                        Game = g.Game != null ? new
                        {
                            g.Game.Id,
                            g.Game.Name
                        } : null,
                        GuideCategory = g.GuideCategory != null ? new
                        {
                            g.GuideCategory.Id,
                            g.GuideCategory.Name
                        } : null
                    })
                    .ToListAsync();

                return Ok(new { message = "Benzer kılavuzlar", data = similarGuides });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetGuideCategories()
        {
            try
            {
                var categories = await _context.GuideCategories
                    .Select(gc => new 
                    {
                        gc.Id,
                        gc.Name,
                        gc.Description,
                        gc.IconClass,
                        gc.Order,
                        gc.CreatedDate
                    })
                    .OrderBy(gc => gc.Order)
                    .ThenBy(gc => gc.Name)
                    .ToListAsync();

                return Ok(new { message = "Kılavuz kategorileri", data = categories });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}