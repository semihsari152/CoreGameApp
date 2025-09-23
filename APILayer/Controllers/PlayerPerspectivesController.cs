using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Entities;
using DomainLayer.Interfaces;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayerPerspectivesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public PlayerPerspectivesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPlayerPerspectives()
        {
            try
            {
                var playerPerspectives = await _unitOfWork.Repository<PlayerPerspective>().GetAllAsync();
                return Ok(new { 
                    message = "Oyuncu perspektifleri listelendi", 
                    data = playerPerspectives.Select(pp => new { 
                        pp.Id, 
                        pp.Name, 
                        pp.Description, 
                        pp.CreatedDate 
                    }) 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlayerPerspectiveById(int id)
        {
            try
            {
                var playerPerspective = await _unitOfWork.Repository<PlayerPerspective>().GetByIdAsync(id);
                if (playerPerspective == null)
                {
                    return NotFound(new { message = "Oyuncu perspektifi bulunamadı" });
                }

                return Ok(new { 
                    message = "Oyuncu perspektifi detayları", 
                    data = new { 
                        playerPerspective.Id, 
                        playerPerspective.Name, 
                        playerPerspective.Description, 
                        playerPerspective.CreatedDate 
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
        public async Task<IActionResult> CreatePlayerPerspective([FromBody] CreatePlayerPerspectiveDto createDto)
        {
            try
            {
                // Check if player perspective name already exists
                var existing = await _unitOfWork.Repository<PlayerPerspective>().FirstOrDefaultAsync(pp => pp.Name == createDto.Name);
                if (existing != null)
                {
                    return BadRequest(new { message = "Bu oyuncu perspektifi adı zaten mevcut" });
                }

                var playerPerspective = new PlayerPerspective
                {
                    Name = createDto.Name,
                    Description = createDto.Description,
                    CreatedDate = DateTime.UtcNow
                };

                await _unitOfWork.Repository<PlayerPerspective>().AddAsync(playerPerspective);
                await _unitOfWork.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPlayerPerspectiveById), new { id = playerPerspective.Id }, 
                    new { 
                        message = "Oyuncu perspektifi oluşturuldu", 
                        data = new { 
                            playerPerspective.Id, 
                            playerPerspective.Name, 
                            playerPerspective.Description, 
                            playerPerspective.CreatedDate 
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
        public async Task<IActionResult> UpdatePlayerPerspective(int id, [FromBody] UpdatePlayerPerspectiveDto updateDto)
        {
            try
            {
                var playerPerspective = await _unitOfWork.Repository<PlayerPerspective>().GetByIdAsync(id);
                if (playerPerspective == null)
                {
                    return NotFound(new { message = "Oyuncu perspektifi bulunamadı" });
                }

                // Check if new name already exists (excluding current player perspective)
                if (!string.IsNullOrEmpty(updateDto.Name) && updateDto.Name != playerPerspective.Name)
                {
                    var existing = await _unitOfWork.Repository<PlayerPerspective>().FirstOrDefaultAsync(pp => pp.Name == updateDto.Name);
                    if (existing != null)
                    {
                        return BadRequest(new { message = "Bu oyuncu perspektifi adı zaten mevcut" });
                    }
                }

                if (!string.IsNullOrEmpty(updateDto.Name))
                    playerPerspective.Name = updateDto.Name;
                    
                if (updateDto.Description != null)
                    playerPerspective.Description = updateDto.Description;

                _unitOfWork.Repository<PlayerPerspective>().Update(playerPerspective);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { 
                    message = "Oyuncu perspektifi güncellendi", 
                    data = new { 
                        playerPerspective.Id, 
                        playerPerspective.Name, 
                        playerPerspective.Description, 
                        playerPerspective.CreatedDate 
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
        public async Task<IActionResult> DeletePlayerPerspective(int id)
        {
            try
            {
                var playerPerspective = await _unitOfWork.Repository<PlayerPerspective>().GetByIdAsync(id);
                if (playerPerspective == null)
                {
                    return NotFound(new { message = "Oyuncu perspektifi bulunamadı" });
                }

                // Check if player perspective is used by any games
                var isUsed = await _unitOfWork.Games.AnyAsync(g => g.GamePlayerPerspectives.Any(gpp => gpp.PlayerPerspectiveId == id));
                if (isUsed)
                {
                    return BadRequest(new { message = "Bu oyuncu perspektifi oyunlar tarafından kullanıldığı için silinemez" });
                }

                _unitOfWork.Repository<PlayerPerspective>().Remove(playerPerspective);
                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Oyuncu perspektifi silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/games")]
        public async Task<IActionResult> GetPlayerPerspectiveGames(int id)
        {
            try
            {
                var playerPerspective = await _unitOfWork.Repository<PlayerPerspective>().GetByIdAsync(id);
                if (playerPerspective == null)
                {
                    return NotFound(new { message = "Oyuncu perspektifi bulunamadı" });
                }

                // Get games for this player perspective
                var games = await _unitOfWork.Games.FindAsync(g => g.GamePlayerPerspectives.Any(gpp => gpp.PlayerPerspectiveId == id));
                
                return Ok(new { 
                    message = "Oyuncu perspektifi oyunları", 
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
        public async Task<IActionResult> SeedPlayerPerspectives()
        {
            try
            {
                var defaultPlayerPerspectives = new[]
                {
                    new PlayerPerspective { Name = "Birinci Şahıs", Description = "First Person Perspective", CreatedDate = DateTime.UtcNow },
                    new PlayerPerspective { Name = "Üçüncü Şahıs", Description = "Third Person Perspective", CreatedDate = DateTime.UtcNow },
                    new PlayerPerspective { Name = "Kuş Bakışı", Description = "Bird View / Top-down Perspective", CreatedDate = DateTime.UtcNow },
                    new PlayerPerspective { Name = "Yan Görünüm", Description = "Side View Perspective", CreatedDate = DateTime.UtcNow },
                    new PlayerPerspective { Name = "İzometrik", Description = "Isometric Perspective", CreatedDate = DateTime.UtcNow },
                    new PlayerPerspective { Name = "Sanal Gerçeklik", Description = "Virtual Reality Perspective", CreatedDate = DateTime.UtcNow }
                };

                foreach (var playerPerspective in defaultPlayerPerspectives)
                {
                    var existing = await _unitOfWork.Repository<PlayerPerspective>().FirstOrDefaultAsync(pp => pp.Name == playerPerspective.Name);
                    if (existing == null)
                    {
                        await _unitOfWork.Repository<PlayerPerspective>().AddAsync(playerPerspective);
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                return Ok(new { message = "Varsayılan oyuncu perspektifleri oluşturuldu" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class CreatePlayerPerspectiveDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdatePlayerPerspectiveDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }
}