using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using InfrastructureLayer.Data;
using ApplicationLayer.DTOs;
using ApplicationLayer.Utils;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForumController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly AppDbContext _context;

        public ForumController(IUnitOfWork unitOfWork, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _context = context;
        }

        // Forum Categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetForumCategories()
        {
            try
            {
                var categories = await _context.ForumCategories
                    .OrderBy(fc => fc.Order)
                    .ToListAsync();

                return Ok(new { 
                    message = "Forum kategorileri", 
                    data = categories.Select(fc => new { 
                        fc.Id, 
                        fc.Name, 
                        fc.Description, 
                        fc.Order, 
                        fc.CreatedDate 
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> CreateForumCategory([FromBody] CreateForumCategoryDto createCategoryDto)
        {
            try
            {
                var category = new ForumCategory
                {
                    Name = createCategoryDto.Name,
                    Description = createCategoryDto.Description,
                    Order = createCategoryDto.DisplayOrder,
                    CreatedDate = DateTime.UtcNow
                };

                await _unitOfWork.ForumCategories.AddAsync(category);
                await _unitOfWork.SaveChangesAsync();

                return CreatedAtAction(nameof(GetForumCategories), 
                    new { 
                        message = "Forum kategorisi oluşturuldu", 
                        data = new { 
                            category.Id, 
                            category.Name, 
                            category.Description, 
                            category.Order, 
                            category.CreatedDate 
                        } 
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Forum Topics
        [HttpGet("categories/{categoryId}/topics")]
        public async Task<IActionResult> GetForumTopics(int categoryId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var topics = await _context.ForumTopics
                    .Include(ft => ft.User)
                    .Include(ft => ft.ForumCategory)
                    .Where(ft => ft.ForumCategoryId == categoryId)
                    .OrderByDescending(ft => ft.IsSticky)
                    .ThenByDescending(ft => ft.UpdatedDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new { 
                    message = "Forum konuları", 
                    data = topics.Select(ft => new { 
                        ft.Id, 
                        ft.Title, 
                        ft.Content, 
                        ft.IsSticky, 
                        ft.IsLocked, 
                        ft.IsPublished,
                        ft.ViewCount, 
                        ft.ReplyCount, 
                        ft.CreatedDate, 
                        ft.UpdatedDate,
                        User = new {
                            ft.User.Id,
                            ft.User.Username,
                            ft.User.AvatarUrl
                        },
                        Category = new {
                            ft.ForumCategory.Id,
                            ft.ForumCategory.Name
                        }
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Get all topics (for main forum page)
        [HttpGet("topics")]
        public async Task<IActionResult> GetAllForumTopics([FromQuery] int? categoryId = null, [FromQuery] int? gameId = null, [FromQuery] string? searchTerm = null, [FromQuery] string? sortBy = "latest", [FromQuery] string[]? tags = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var query = _context.ForumTopics
                    .Include(ft => ft.User)
                    .Include(ft => ft.ForumCategory)
                    .Include(ft => ft.Game)
                    .Include(ft => ft.ForumTopicTags)
                        .ThenInclude(ftt => ftt.Tag)
                    .AsQueryable();

                if (categoryId.HasValue)
                {
                    query = query.Where(ft => ft.ForumCategoryId == categoryId.Value);
                }

                if (gameId.HasValue)
                {
                    query = query.Where(ft => ft.GameId == gameId.Value);
                }

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(ft => ft.Title.Contains(searchTerm) || ft.Content.Contains(searchTerm));
                }

                if (tags != null && tags.Length > 0)
                {
                    Console.WriteLine($"Filtering by tags (ALL must match): {string.Join(", ", tags)}");
                    // Tüm taglar aynı forum topic'te bulunmalı
                    foreach (var tag in tags)
                    {
                        query = query.Where(ft => ft.ForumTopicTags.Any(ftt => ftt.Tag.Name == tag));
                    }
                }

                query = sortBy?.ToLower() switch
                {
                    "latest" => query.OrderByDescending(ft => ft.IsSticky).ThenByDescending(ft => ft.CreatedDate),
                    "popular" => query.OrderByDescending(ft => ft.IsSticky).ThenByDescending(ft => ft.ViewCount),
                    "oldest" => query.OrderByDescending(ft => ft.IsSticky).ThenBy(ft => ft.CreatedDate),
                    "replies" => query.OrderByDescending(ft => ft.IsSticky).ThenByDescending(ft => ft.ReplyCount),
                    _ => query.OrderByDescending(ft => ft.IsSticky).ThenByDescending(ft => ft.CreatedDate)
                };

                var totalCount = await query.CountAsync();
                var topics = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var result = topics.Select(ft => new
                {
                    ft.Id,
                    ft.Title,
                    ft.Slug,
                    ft.Content,
                    ft.IsSticky,
                    ft.IsLocked,
                    ft.IsPublished,
                    ft.ViewCount,
                    ft.ReplyCount,
                    ft.CreatedDate,
                    ft.UpdatedDate,
                    User = new
                    {
                        ft.User.Id,
                        ft.User.Username,
                        ft.User.AvatarUrl
                    },
                    Category = new
                    {
                        ft.ForumCategory.Id,
                        ft.ForumCategory.Name
                    },
                    Game = ft.Game != null ? new
                    {
                        Id = ft.Game.Id,
                        Name = ft.Game.Name,
                        CoverImageUrl = ft.Game.CoverImageUrl,
                        ReleaseDate = ft.Game.ReleaseDate
                    } : null,
                    Tags = ft.ForumTopicTags.Select(ftt => ftt.Tag.Name).ToList()
                }).ToList();

                return Ok(new
                {
                    message = "Forum konuları listelendi",
                    data = new
                    {
                        data = result,
                        totalCount = totalCount
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("topics/slug/{slug}")]
        public async Task<IActionResult> GetForumTopicBySlug(string slug)
        {
            try
            {
                var topic = await _context.ForumTopics
                    .Include(ft => ft.User)
                    .Include(ft => ft.ForumCategory)
                    .Include(ft => ft.Game)
                    .Include(ft => ft.ForumTopicTags)
                        .ThenInclude(ftt => ftt.Tag)
                    .FirstOrDefaultAsync(ft => ft.Slug == slug);

                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                // Increment view count
                topic.ViewCount++;
                _context.ForumTopics.Update(topic);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Forum konusu detayları", 
                    data = new { 
                        topic.Id, 
                        topic.Title, 
                        topic.Slug,
                        topic.Content, 
                        topic.IsSticky, 
                        topic.IsLocked, 
                        topic.IsPublished,
                        topic.ViewCount, 
                        topic.ReplyCount, 
                        topic.CreatedDate, 
                        topic.UpdatedDate,
                        topic.UserId, // Frontend için direkt field
                        topic.ForumCategoryId, // Frontend için direkt field
                        topic.GameId, // Frontend için direkt field
                        User = new {
                            topic.User.Id,
                            topic.User.Username,
                            topic.User.AvatarUrl
                        },
                        Category = new {
                            topic.ForumCategory.Id,
                            topic.ForumCategory.Name,
                            topic.ForumCategory.Description
                        },
                        Game = topic.Game != null ? new {
                            Id = topic.Game.Id,
                            Name = topic.Game.Name,
                            Slug = topic.Game.Slug,
                            CoverImageUrl = topic.Game.CoverImageUrl,
                            ReleaseDate = topic.Game.ReleaseDate
                        } : null,
                        Tags = topic.ForumTopicTags.Select(ftt => ftt.Tag.Name).ToList()
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("topics/{id}")]
        public async Task<IActionResult> GetForumTopicById(int id)
        {
            try
            {
                var topic = await _context.ForumTopics
                    .Include(ft => ft.User)
                    .Include(ft => ft.ForumCategory)
                    .Include(ft => ft.Game)
                    .Include(ft => ft.ForumTopicTags)
                        .ThenInclude(ftt => ftt.Tag)
                    .FirstOrDefaultAsync(ft => ft.Id == id);

                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                // Increment view count
                topic.ViewCount++;
                _context.ForumTopics.Update(topic);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Forum konusu detayları", 
                    data = new { 
                        topic.Id, 
                        topic.Title, 
                        topic.Slug,
                        topic.Content, 
                        topic.IsSticky, 
                        topic.IsLocked, 
                        topic.IsPublished,
                        topic.ViewCount, 
                        topic.ReplyCount, 
                        topic.CreatedDate, 
                        topic.UpdatedDate,
                        topic.UserId, // Frontend için direkt field
                        topic.ForumCategoryId, // Frontend için direkt field
                        topic.GameId, // Frontend için direkt field
                        User = new {
                            topic.User.Id,
                            topic.User.Username,
                            topic.User.AvatarUrl
                        },
                        Category = new {
                            topic.ForumCategory.Id,
                            topic.ForumCategory.Name,
                            topic.ForumCategory.Description
                        },
                        Game = topic.Game != null ? new {
                            Id = topic.Game.Id,
                            Name = topic.Game.Name,
                            Slug = topic.Game.Slug,
                            CoverImageUrl = topic.Game.CoverImageUrl,
                            ReleaseDate = topic.Game.ReleaseDate
                        } : null,
                        Tags = topic.ForumTopicTags.Select(ftt => ftt.Tag.Name).ToList()
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("topics")]
        [Authorize]
        public async Task<IActionResult> CreateForumTopic([FromBody] CreateForumTopicDto createTopicDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Check if category exists
                var category = await _unitOfWork.ForumCategories.GetByIdAsync(createTopicDto.ForumCategoryId);
                if (category == null)
                {
                    return NotFound(new { message = "Forum kategorisi bulunamadı" });
                }

                // Generate slug
                var baseSlug = SlugGenerator.GenerateSlug(createTopicDto.Title);
                var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                    _context.ForumTopics.Any(ft => ft.Slug == slug));

                var topic = new ForumTopic
                {
                    Title = createTopicDto.Title,
                    Slug = uniqueSlug,
                    Content = createTopicDto.Content,
                    UserId = userId,
                    ForumCategoryId = createTopicDto.ForumCategoryId,
                    GameId = createTopicDto.GameId,
                    IsSticky = createTopicDto.IsSticky,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };

                await _unitOfWork.ForumTopics.AddAsync(topic);
                await _unitOfWork.SaveChangesAsync();

                // Handle tags if provided
                if (createTopicDto.Tags != null && createTopicDto.Tags.Any())
                {
                    foreach (var tagName in createTopicDto.Tags)
                    {
                        // Get or create tag
                        var existingTag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName);
                        if (existingTag == null)
                        {
                            existingTag = new Tag
                            {
                                Name = tagName,
                                CreatedDate = DateTime.UtcNow
                            };
                            await _context.Tags.AddAsync(existingTag);
                            await _context.SaveChangesAsync();
                        }

                        // Create ForumTopicTag relationship
                        var forumTopicTag = new ForumTopicTag
                        {
                            ForumTopicId = topic.Id,
                            TagId = existingTag.Id,
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.ForumTopicTags.AddAsync(forumTopicTag);
                    }
                    await _context.SaveChangesAsync();
                }

                return CreatedAtAction(nameof(GetForumTopicById), new { id = topic.Id }, 
                    new { 
                        message = "Forum konusu oluşturuldu", 
                        data = new { 
                            topic.Id, 
                            topic.Title, 
                            topic.Slug,
                            topic.Content, 
                            topic.CreatedDate 
                        } 
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("topics/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateForumTopic(int id, [FromBody] UpdateForumTopicDto updateTopicDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                // Check if user can edit this topic
                if (topic.UserId != userId && userRole != "Admin" && userRole != "Moderator")
                {
                    return Forbid("Bu konuyu düzenleme yetkiniz yok");
                }

                if (topic.IsLocked && userRole != "Admin" && userRole != "Moderator")
                {
                    return BadRequest(new { message = "Bu konu kilitlenmiş" });
                }

                if (!string.IsNullOrEmpty(updateTopicDto.Title))
                {
                    topic.Title = updateTopicDto.Title;
                    // Update slug when title changes
                    var baseSlug = SlugGenerator.GenerateSlug(updateTopicDto.Title);
                    var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                        _context.ForumTopics.Any(ft => ft.Slug == slug && ft.Id != id));
                    topic.Slug = uniqueSlug;
                }
                    
                if (!string.IsNullOrEmpty(updateTopicDto.Content))
                    topic.Content = updateTopicDto.Content;

                // Update category if provided
                if (updateTopicDto.CategoryId.HasValue || updateTopicDto.ForumCategoryId.HasValue)
                    topic.ForumCategoryId = updateTopicDto.CategoryId ?? updateTopicDto.ForumCategoryId.Value;

                // Update game if provided
                if (updateTopicDto.GameId.HasValue)
                    topic.GameId = updateTopicDto.GameId;

                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);

                // Handle tags update
                if (updateTopicDto.Tags != null)
                {
                    // Remove existing topic tags
                    var existingTopicTags = await _context.ForumTopicTags
                        .Where(ftt => ftt.ForumTopicId == id)
                        .ToListAsync();
                    
                    _context.ForumTopicTags.RemoveRange(existingTopicTags);

                    // Add new tags
                    foreach (var tagName in updateTopicDto.Tags)
                    {
                        if (string.IsNullOrWhiteSpace(tagName)) continue;

                        // Find or create tag
                        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName.Trim());
                        if (tag == null)
                        {
                            tag = new Tag
                            {
                                Name = tagName.Trim(),
                                CreatedDate = DateTime.UtcNow
                            };
                            await _context.Tags.AddAsync(tag);
                            await _context.SaveChangesAsync(); // Save to get tag ID
                        }

                        // Add forum topic-tag relationship
                        var forumTopicTag = new ForumTopicTag
                        {
                            ForumTopicId = id,
                            TagId = tag.Id,
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.ForumTopicTags.AddAsync(forumTopicTag);
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                return Ok(new { 
                    message = "Forum konusu güncellendi", 
                    data = new { 
                        topic.Id, 
                        topic.Title, 
                        topic.Slug,
                        topic.Content, 
                        topic.UpdatedDate 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("topics/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteForumTopic(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                // Check if user can delete this topic
                if (topic.UserId != userId && userRole != "Admin" && userRole != "Moderator")
                {
                    return Forbid("Bu konuyu silme yetkiniz yok");
                }

                _unitOfWork.ForumTopics.Remove(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("topics/{id}/lock")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> LockForumTopic(int id)
        {
            try
            {
                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                topic.IsLocked = true;
                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu kilitlendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("topics/{id}/unlock")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UnlockForumTopic(int id)
        {
            try
            {
                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                topic.IsLocked = false;
                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu kilidi açıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("topics/{id}/pin")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> PinForumTopic(int id)
        {
            try
            {
                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                topic.IsSticky = true;
                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu sabitlendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("topics/{id}/unpin")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UnpinForumTopic(int id)
        {
            try
            {
                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                topic.IsSticky = false;
                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu sabitlenmesi kaldırıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> PublishTopic(int id)
        {
            try
            {
                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                topic.IsPublished = true;
                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu yayına alındı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/unpublish")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UnpublishTopic(int id)
        {
            try
            {
                var topic = await _unitOfWork.ForumTopics.GetByIdAsync(id);
                if (topic == null)
                {
                    return NotFound(new { message = "Forum konusu bulunamadı" });
                }

                topic.IsPublished = false;
                topic.UpdatedDate = DateTime.UtcNow;

                _unitOfWork.ForumTopics.Update(topic);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Forum konusu yayından kaldırıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchForumTopics([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest(new { message = "Arama terimi gereklidir" });
                }

                var topics = await _context.ForumTopics
                    .Include(ft => ft.User)
                    .Include(ft => ft.ForumCategory)
                    .Where(ft => ft.Title.Contains(query) || ft.Content.Contains(query))
                    .OrderByDescending(ft => ft.UpdatedDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new { 
                    message = "Forum arama sonuçları", 
                    data = topics.Select(ft => new { 
                        ft.Id, 
                        ft.Title, 
                        ft.Content, 
                        ft.ViewCount, 
                        ft.ReplyCount, 
                        ft.CreatedDate,
                        User = new {
                            ft.User.Id,
                            ft.User.Username
                        },
                        Category = new {
                            ft.ForumCategory.Id,
                            ft.ForumCategory.Name
                        }
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

}