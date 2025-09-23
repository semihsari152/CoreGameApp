using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Entities;
using DomainLayer.Interfaces;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public TagsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTags()
        {
            try
            {
                var tags = await _unitOfWork.Tags.GetAllAsync();
                return Ok(new { 
                    message = "Etiketler listelendi", 
                    data = tags.Select(t => new { 
                        t.Id, 
                        t.Name, 
                        t.Description, 
                        t.CreatedDate 
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTagById(int id)
        {
            try
            {
                var tag = await _unitOfWork.Tags.GetByIdAsync(id);
                if (tag == null)
                {
                    return NotFound(new { message = "Etiket bulunamadı" });
                }

                return Ok(new { 
                    message = "Etiket detayları", 
                    data = new { 
                        tag.Id, 
                        tag.Name, 
                        tag.Description, 
                        tag.CreatedDate 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagDto createTagDto)
        {
            try
            {
                var existingTag = await _unitOfWork.Tags.FirstOrDefaultAsync(t => t.Name == createTagDto.Name);
                if (existingTag != null)
                {
                    return BadRequest(new { message = "Bu etiket adı zaten mevcut" });
                }

                var tag = new Tag
                {
                    Name = createTagDto.Name,
                    Description = createTagDto.Description,
                    CreatedDate = DateTime.UtcNow
                };

                await _unitOfWork.Tags.AddAsync(tag);
                await _unitOfWork.SaveChangesAsync();

                return CreatedAtAction(nameof(GetTagById), new { id = tag.Id }, 
                    new { 
                        message = "Etiket oluşturuldu", 
                        data = new { 
                            tag.Id, 
                            tag.Name, 
                            tag.Description, 
                            tag.CreatedDate 
                        } 
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UpdateTag(int id, [FromBody] UpdateTagDto updateTagDto)
        {
            try
            {
                var tag = await _unitOfWork.Tags.GetByIdAsync(id);
                if (tag == null)
                {
                    return NotFound(new { message = "Etiket bulunamadı" });
                }

                if (!string.IsNullOrEmpty(updateTagDto.Name) && updateTagDto.Name != tag.Name)
                {
                    var existingTag = await _unitOfWork.Tags.FirstOrDefaultAsync(t => t.Name == updateTagDto.Name);
                    if (existingTag != null)
                    {
                        return BadRequest(new { message = "Bu etiket adı zaten mevcut" });
                    }
                }

                if (!string.IsNullOrEmpty(updateTagDto.Name))
                    tag.Name = updateTagDto.Name;
                    
                if (updateTagDto.Description != null)
                    tag.Description = updateTagDto.Description;

                _unitOfWork.Tags.Update(tag);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { 
                    message = "Etiket güncellendi", 
                    data = new { 
                        tag.Id, 
                        tag.Name, 
                        tag.Description, 
                        tag.CreatedDate 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            try
            {
                var tag = await _unitOfWork.Tags.GetByIdAsync(id);
                if (tag == null)
                {
                    return NotFound(new { message = "Etiket bulunamadı" });
                }

                _unitOfWork.Tags.Remove(tag);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Etiket silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/games")]
        public async Task<IActionResult> GetTagGames(int id)
        {
            try
            {
                var tag = await _unitOfWork.Tags.GetByIdAsync(id);
                if (tag == null)
                {
                    return NotFound(new { message = "Etiket bulunamadı" });
                }

                var gameTags = await _unitOfWork.GameTags.FindAsync(gt => gt.TagId == id);
                var gameIds = gameTags.Select(gt => gt.GameId).ToList();
                var games = await _unitOfWork.Games.FindAsync(g => gameIds.Contains(g.Id));
                
                return Ok(new { 
                    message = "Etiket oyunları", 
                    data = games.Select(g => new { 
                        g.Id, 
                        g.Name, 
                        g.Description, 
                        g.Publisher, 
                        g.Developer, 
                        AverageRating = g.GameIgdbRating?.UserRatingDisplay 
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("seed")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SeedTags()
        {
            try
            {
                var defaultTags = new[]
                {
                    new Tag { Name = "Tek Oyunculu", Description = "Tek kişilik oynanabilen", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Çok Oyunculu", Description = "Çok kişilik oynanabilen", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Online", Description = "Online oynanabilen", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Çevrimdışı", Description = "Çevrimdışı oynanabilen", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Açık Dünya", Description = "Açık dünya oyunu", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Hikaye", Description = "Güçlü hikayesi olan", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Grafik", Description = "Güçlü grafikleri olan", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Bağımsız", Description = "Indie oyunu", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Ücretsiz", Description = "Ücretsiz oyun", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Erken Erişim", Description = "Erken erişim oyunu", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Retro", Description = "Retro tarzı oyun", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Pixel Art", Description = "Pixel art grafikli", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "3D", Description = "3D oyun", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "2D", Description = "2D oyun", CreatedDate = DateTime.UtcNow },
                    new Tag { Name = "Zorlu", Description = "Zorlu oyun", CreatedDate = DateTime.UtcNow }
                };

                foreach (var tag in defaultTags)
                {
                    var existing = await _unitOfWork.Tags.FirstOrDefaultAsync(t => t.Name == tag.Name);
                    if (existing == null)
                    {
                        await _unitOfWork.Tags.AddAsync(tag);
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Varsayılan etiketler oluşturuldu" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class CreateTagDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateTagDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}