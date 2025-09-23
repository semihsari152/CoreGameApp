using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GenresController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public GenresController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllGenres()
        {
            try
            {
                var genres = await _unitOfWork.Genres.GetAllAsync();
                return Ok(new { 
                    message = "Türler listelendi", 
                    data = genres.Select(g => new { 
                        g.Id, 
                        g.Name, 
                        g.Description, 
                        g.CreatedDate 
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGenreById(int id)
        {
            try
            {
                var genre = await _unitOfWork.Genres.GetByIdAsync(id);
                if (genre == null)
                {
                    return NotFound(new { message = "Tür bulunamadı" });
                }

                return Ok(new { 
                    message = "Tür detayları", 
                    data = new { 
                        genre.Id, 
                        genre.Name, 
                        genre.Description, 
                        genre.CreatedDate 
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
        public async Task<IActionResult> CreateGenre([FromBody] CreateGenreDto createGenreDto)
        {
            try
            {
                // Check if genre name already exists
                var existingGenre = await _unitOfWork.Genres.FirstOrDefaultAsync(g => g.Name == createGenreDto.Name);
                if (existingGenre != null)
                {
                    return BadRequest(new { message = "Bu tür adı zaten mevcut" });
                }

                var genre = new Genre
                {
                    Name = createGenreDto.Name,
                    Description = createGenreDto.Description,
                    CreatedDate = DateTime.UtcNow
                };

                await _unitOfWork.Genres.AddAsync(genre);
                await _unitOfWork.SaveChangesAsync();

                return CreatedAtAction(nameof(GetGenreById), new { id = genre.Id }, 
                    new { 
                        message = "Tür oluşturuldu", 
                        data = new { 
                            genre.Id, 
                            genre.Name, 
                            genre.Description, 
                            genre.CreatedDate 
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
        public async Task<IActionResult> UpdateGenre(int id, [FromBody] UpdateGenreDto updateGenreDto)
        {
            try
            {
                var genre = await _unitOfWork.Genres.GetByIdAsync(id);
                if (genre == null)
                {
                    return NotFound(new { message = "Tür bulunamadı" });
                }

                // Check if new name already exists (excluding current genre)
                if (!string.IsNullOrEmpty(updateGenreDto.Name) && updateGenreDto.Name != genre.Name)
                {
                    var existingGenre = await _unitOfWork.Genres.FirstOrDefaultAsync(g => g.Name == updateGenreDto.Name);
                    if (existingGenre != null)
                    {
                        return BadRequest(new { message = "Bu tür adı zaten mevcut" });
                    }
                }

                if (!string.IsNullOrEmpty(updateGenreDto.Name))
                    genre.Name = updateGenreDto.Name;
                    
                if (updateGenreDto.Description != null)
                    genre.Description = updateGenreDto.Description;

                _unitOfWork.Genres.Update(genre);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { 
                    message = "Tür güncellendi", 
                    data = new { 
                        genre.Id, 
                        genre.Name, 
                        genre.Description, 
                        genre.CreatedDate 
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
        public async Task<IActionResult> DeleteGenre(int id)
        {
            try
            {
                var genre = await _unitOfWork.Genres.GetByIdAsync(id);
                if (genre == null)
                {
                    return NotFound(new { message = "Tür bulunamadı" });
                }

                // Check if genre is used by any games
                var isUsed = await _unitOfWork.Games.AnyAsync(g => g.GameGenres.Any(gg => gg.GenreId == id));
                if (isUsed)
                {
                    return BadRequest(new { message = "Bu tür oyunlar tarafından kullanıldığı için silinemez" });
                }

                _unitOfWork.Genres.Remove(genre);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Tür silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/games")]
        public async Task<IActionResult> GetGenreGames(int id)
        {
            try
            {
                var genre = await _unitOfWork.Genres.GetByIdAsync(id);
                if (genre == null)
                {
                    return NotFound(new { message = "Tür bulunamadı" });
                }

                // Get games for this genre
                var games = await _unitOfWork.Games.FindAsync(g => g.GameGenres.Any(gg => gg.GenreId == id));
                
                return Ok(new { 
                    message = "Tür oyunları", 
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
        public async Task<IActionResult> SeedGenres()
        {
            try
            {
                var defaultGenres = new[]
                {
                    new Genre { Name = "Aksiyon", Description = "Aksiyon oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Macera", Description = "Macera oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "RPG", Description = "Rol yapma oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Strateji", Description = "Strateji oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Spor", Description = "Spor oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Yarış", Description = "Yarış oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Bulmaca", Description = "Bulmaca oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Simülasyon", Description = "Simülasyon oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Korku", Description = "Korku oyunları", CreatedDate = DateTime.UtcNow },
                    new Genre { Name = "Multiplayer", Description = "Çok oyunculu oyunlar", CreatedDate = DateTime.UtcNow }
                };

                foreach (var genre in defaultGenres)
                {
                    var existing = await _unitOfWork.Genres.FirstOrDefaultAsync(g => g.Name == genre.Name);
                    if (existing == null)
                    {
                        await _unitOfWork.Genres.AddAsync(genre);
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Varsayılan türler oluşturuldu" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class CreateGenreDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateGenreDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}