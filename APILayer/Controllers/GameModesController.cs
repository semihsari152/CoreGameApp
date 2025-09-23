using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Interfaces;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameModesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public GameModesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var gameModes = await _unitOfWork.GameModes.GetAllAsync();
                return Ok(new { 
                    message = "Game modes retrieved successfully", 
                    data = gameModes.Select(g => new { 
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
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var gameMode = await _unitOfWork.GameModes.GetByIdAsync(id);
                if (gameMode == null)
                {
                    return NotFound(new { message = "Game mode not found" });
                }

                return Ok(new { 
                    message = "Game mode retrieved successfully", 
                    data = new { 
                        gameMode.Id, 
                        gameMode.Name, 
                        gameMode.Description, 
                        gameMode.CreatedDate 
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}