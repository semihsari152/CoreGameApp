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
    [Route("api/blogs")]
    public class BlogController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly AppDbContext _context;

        public BlogController(IUnitOfWork unitOfWork, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBlogs([FromQuery] string? sortBy = "latest", [FromQuery] int page = 1, [FromQuery] int pageSize = 12, [FromQuery] string? searchTerm = null, [FromQuery] int? gameId = null, [FromQuery] int? categoryId = null, [FromQuery] List<string>? tags = null, [FromQuery] bool includeUnpublished = false)
        {
            try
            {
                var query = _context.BlogPosts
                    .Include(b => b.User)
                    .Include(b => b.Game)
                    .Include(b => b.Category)
                    .Include(b => b.BlogPostTags)
                        .ThenInclude(bt => bt.Tag)
                    .Include(b => b.Comments)
                    .Include(b => b.Likes)
                    .AsQueryable();

                // Filter published status based on request
                if (!includeUnpublished)
                {
                    query = query.Where(b => b.IsPublished);
                }

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(b => b.Title.Contains(searchTerm) || b.Content.Contains(searchTerm));
                }

                if (gameId.HasValue)
                {
                    query = query.Where(b => b.GameId == gameId.Value);
                }

                if (categoryId.HasValue)
                {
                    query = query.Where(b => b.CategoryId == categoryId.Value);
                }

                if (tags != null && tags.Any())
                {
                    query = query.Where(b => b.BlogPostTags.Any(bt => tags.Contains(bt.Tag.Name)));
                }

                query = sortBy?.ToLower() switch
                {
                    "latest" => query.OrderByDescending(b => b.CreatedDate),
                    "popular" => query.OrderByDescending(b => b.ViewCount),
                    "title" => query.OrderBy(b => b.Title),
                    _ => query.OrderByDescending(b => b.CreatedDate)
                };

                var totalCount = await query.CountAsync();
                var blogs = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(b => new
                    {
                        b.Id,
                        b.Title,
                        b.Slug,
                        b.Content,
                        b.Summary,
                        b.CoverImageUrl,
                        ThumbnailUrl = b.CoverImageUrl,
                        b.ViewCount,
                        b.IsPublished,
                        b.CreatedDate,
                        b.UpdatedDate,
                        CreatedAt = b.CreatedDate,
                        UpdatedAt = b.UpdatedDate,
                        Author = new
                        {
                            b.User.Id,
                            b.User.Username,
                            b.User.AvatarUrl
                        },
                        Games = b.Game != null ? new[]
                        {
                            new
                            {
                                b.Game.Id,
                                Name = b.Game.Name,  // Game entity'sinde Name field'ı kullanılıyor
                                b.Game.CoverImageUrl
                            }
                        } : new object[0],
                        Category = b.Category != null ? new
                        {
                            b.Category.Id,
                            b.Category.Name,
                            b.Category.Description,
                            b.Category.Color
                        } : null,
                        Tags = b.BlogPostTags.Select(bt => bt.Tag.Name).ToList(),
                        LikesCount = b.Likes.Where(l => l.IsLike == true).Count(),
                        DislikesCount = b.Likes.Where(l => l.IsLike == false).Count(),
                        CommentsCount = b.Comments.Count(),
                        FavoritesCount = 0  // Şimdilik 0, UserFavoriteList entity'si yok
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Blog yazıları listelendi",
                    data = new
                    {
                        data = blogs,
                        totalCount = totalCount
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBlogBySlug(string slug)
        {
            try
            {
                var blog = await _context.BlogPosts
                    .Include(b => b.User)
                    .Include(b => b.Game)
                    .Include(b => b.Category)
                    .Include(b => b.BlogPostTags)
                        .ThenInclude(bt => bt.Tag)
                    .FirstOrDefaultAsync(b => b.Slug == slug);

                if (blog == null)
                {
                    return NotFound(new { message = "Blog yazısı bulunamadı" });
                }

                // Görüntülenme sayısını artır
                blog.ViewCount++;
                await _context.SaveChangesAsync();

                var blogDto = new
                {
                    blog.Id,
                    blog.Title,
                    blog.Slug,
                    blog.Content,
                    blog.Summary,
                    blog.CoverImageUrl,
                    ThumbnailUrl = blog.CoverImageUrl,
                    blog.ViewCount,
                    blog.CreatedDate,
                    blog.UpdatedDate,
                    CreatedAt = blog.CreatedDate,
                    UpdatedAt = blog.UpdatedDate,
                    Author = new
                    {
                        blog.User.Id,
                        blog.User.Username,
                        blog.User.AvatarUrl
                    },
                    Game = blog.Game != null ? new
                    {
                        blog.Game.Id,
                        blog.Game.Name,
                        blog.Game.Slug,
                        blog.Game.CoverImageUrl,
                        blog.Game.ReleaseDate
                    } : null,
                    Category = blog.Category != null ? new
                    {
                        blog.Category.Id,
                        blog.Category.Name,
                        blog.Category.Description,
                        blog.Category.Color
                    } : null,
                    Tags = blog.BlogPostTags.Select(bt => bt.Tag.Name).ToList()
                };

                return Ok(new { message = "Blog detayları", data = blogDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBlogById(int id)
        {
            try
            {
                var blog = await _context.BlogPosts
                    .Include(b => b.User)
                    .Include(b => b.Game)
                    .Include(b => b.Category)
                    .Include(b => b.BlogPostTags)
                        .ThenInclude(bt => bt.Tag)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (blog == null)
                {
                    return NotFound(new { message = "Blog yazısı bulunamadı" });
                }

                // Görüntülenme sayısını artır
                blog.ViewCount++;
                await _context.SaveChangesAsync();

                var blogDto = new
                {
                    blog.Id,
                    blog.Title,
                    blog.Slug,
                    blog.Content,
                    blog.Summary,
                    blog.CoverImageUrl,
                    ThumbnailUrl = blog.CoverImageUrl,
                    blog.ViewCount,
                    blog.CreatedDate,
                    blog.UpdatedDate,
                    CreatedAt = blog.CreatedDate,
                    UpdatedAt = blog.UpdatedDate,
                    Author = new
                    {
                        blog.User.Id,
                        blog.User.Username,
                        blog.User.AvatarUrl
                    },
                    Game = blog.Game != null ? new
                    {
                        blog.Game.Id,
                        blog.Game.Name,
                        blog.Game.Slug,
                        blog.Game.CoverImageUrl,
                        blog.Game.ReleaseDate
                    } : null,
                    Category = blog.Category != null ? new
                    {
                        blog.Category.Id,
                        blog.Category.Name,
                        blog.Category.Description,
                        blog.Category.Color
                    } : null,
                    Tags = blog.BlogPostTags.Select(bt => bt.Tag.Name).ToList()
                };

                return Ok(new { message = "Blog detayları", data = blogDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetBlogCategories()
        {
            try
            {
                var categories = await _context.BlogCategories
                    .OrderBy(c => c.Order)
                    .ToListAsync();

                var categoriesDto = categories.Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.Color,
                    c.Order
                }).ToList();

                return Ok(new { message = "Blog kategorileri", data = categoriesDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateBlog([FromBody] CreateBlogPostDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Generate slug
                var baseSlug = SlugGenerator.GenerateSlug(dto.Title);
                var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                    _context.BlogPosts.Any(b => b.Slug == slug));

                var blog = new BlogPost
                {
                    Title = dto.Title,
                    Slug = uniqueSlug,
                    Content = dto.Content,
                    Summary = dto.Summary,
                    CoverImageUrl = dto.CoverImageUrl,
                    UserId = userId,
                    GameId = dto.GameId,
                    CategoryId = dto.CategoryId,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow,
                    IsPublished = dto.IsPublished
                };

                _context.BlogPosts.Add(blog);
                await _context.SaveChangesAsync();

                // Add tags if provided
                if (dto.Tags != null && dto.Tags.Any())
                {
                    foreach (var tagName in dto.Tags)
                    {
                        if (string.IsNullOrWhiteSpace(tagName)) continue;

                        // Find or create tag
                        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName.Trim());
                        if (tag == null)
                        {
                            tag = new DomainLayer.Entities.Tag
                            {
                                Name = tagName.Trim(),
                                CreatedDate = DateTime.UtcNow
                            };
                            _context.Tags.Add(tag);
                            await _context.SaveChangesAsync();
                        }

                        // Create blog post tag relationship
                        var blogPostTag = new DomainLayer.Entities.BlogPostTag
                        {
                            BlogPostId = blog.Id,
                            TagId = tag.Id,
                            CreatedDate = DateTime.UtcNow
                        };
                        _context.BlogPostTags.Add(blogPostTag);
                    }
                    await _context.SaveChangesAsync();
                }

                // Log the created blog for debugging
                Console.WriteLine($"Blog created with ID: {blog.Id}, Title: {blog.Title}");

                return Ok(new { 
                    message = "Blog yazısı oluşturuldu", 
                    data = new { 
                        id = blog.Id,
                        title = blog.Title,
                        slug = blog.Slug,
                        content = blog.Content,
                        summary = blog.Summary,
                        coverImageUrl = blog.CoverImageUrl,
                        createdDate = blog.CreatedDate,
                        updatedDate = blog.UpdatedDate
                    } 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating blog: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateBlog(int id, [FromBody] UpdateBlogPostDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var blog = await _context.BlogPosts
                    .Include(b => b.BlogPostTags)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (blog == null)
                {
                    return NotFound(new { message = "Blog yazısı bulunamadı" });
                }

                // Check if user can edit this blog
                if (blog.UserId != userId && userRole != "Admin" && userRole != "Moderator")
                {
                    return Forbid("Bu blog yazısını düzenleme yetkiniz yok");
                }

                // Update blog fields
                if (!string.IsNullOrEmpty(dto.Title))
                {
                    blog.Title = dto.Title;
                    // Update slug when title changes
                    var baseSlug = SlugGenerator.GenerateSlug(dto.Title);
                    var uniqueSlug = SlugGenerator.EnsureUnique(baseSlug, slug => 
                        _context.BlogPosts.Any(b => b.Slug == slug && b.Id != id));
                    blog.Slug = uniqueSlug;
                }

                if (!string.IsNullOrEmpty(dto.Content))
                    blog.Content = dto.Content;

                if (!string.IsNullOrEmpty(dto.Summary))
                    blog.Summary = dto.Summary;

                if (dto.CoverImageUrl != null)
                    blog.CoverImageUrl = string.IsNullOrEmpty(dto.CoverImageUrl) ? null : dto.CoverImageUrl;

                if (dto.CategoryId.HasValue)
                    blog.CategoryId = dto.CategoryId;

                if (dto.GameId.HasValue)
                    blog.GameId = dto.GameId == 0 ? null : dto.GameId;

                if (dto.IsPublished.HasValue)
                    blog.IsPublished = dto.IsPublished.Value;

                blog.UpdatedDate = DateTime.UtcNow;

                // Handle tags update
                if (dto.Tags != null)
                {
                    // Remove existing blog post tags
                    var existingBlogTags = await _context.BlogPostTags
                        .Where(bt => bt.BlogPostId == id)
                        .ToListAsync();
                    
                    _context.BlogPostTags.RemoveRange(existingBlogTags);

                    // Add new tags
                    foreach (var tagName in dto.Tags)
                    {
                        if (string.IsNullOrWhiteSpace(tagName)) continue;

                        // Find or create tag
                        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == tagName.Trim());
                        if (tag == null)
                        {
                            tag = new DomainLayer.Entities.Tag
                            {
                                Name = tagName.Trim(),
                                CreatedDate = DateTime.UtcNow
                            };
                            await _context.Tags.AddAsync(tag);
                            await _context.SaveChangesAsync(); // Save to get tag ID
                        }

                        // Add blog post-tag relationship
                        var blogPostTag = new DomainLayer.Entities.BlogPostTag
                        {
                            BlogPostId = id,
                            TagId = tag.Id,
                            CreatedDate = DateTime.UtcNow
                        };
                        await _context.BlogPostTags.AddAsync(blogPostTag);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Blog yazısı güncellendi", 
                    data = new { 
                        id = blog.Id,
                        title = blog.Title,
                        slug = blog.Slug,
                        content = blog.Content,
                        summary = blog.Summary,
                        coverImageUrl = blog.CoverImageUrl,
                        updatedDate = blog.UpdatedDate
                    } 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating blog: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/unpublish")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UnpublishBlog(int id)
        {
            try
            {
                var blog = await _context.BlogPosts.FirstOrDefaultAsync(b => b.Id == id);

                if (blog == null)
                {
                    return NotFound(new { message = "Blog yazısı bulunamadı" });
                }

                blog.IsPublished = false;
                blog.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Blog yazısı yayından kaldırıldı" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error unpublishing blog: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> PublishBlog(int id)
        {
            try
            {
                var blog = await _context.BlogPosts.FirstOrDefaultAsync(b => b.Id == id);

                if (blog == null)
                {
                    return NotFound(new { message = "Blog yazısı bulunamadı" });
                }

                blog.IsPublished = true;
                blog.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Blog yazısı yayına alındı" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error publishing blog: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteBlog(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var blog = await _context.BlogPosts.FirstOrDefaultAsync(b => b.Id == id);

                if (blog == null)
                {
                    return NotFound(new { message = "Blog yazısı bulunamadı" });
                }

                // Check if user can delete this blog
                if (blog.UserId != userId && userRole != "Admin" && userRole != "Moderator")
                {
                    return Forbid("Bu blog yazısını silme yetkiniz yok");
                }

                _context.BlogPosts.Remove(blog);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Blog yazısı silindi" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting blog: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}