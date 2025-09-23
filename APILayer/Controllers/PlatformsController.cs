using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Interfaces;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlatformsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public PlatformsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var platforms = await _unitOfWork.Platforms.GetAllAsync();
                return Ok(new { 
                    message = "Platforms retrieved successfully", 
                    data = platforms.Select(p => new { 
                        p.Id, 
                        p.Name, 
                        p.Description, 
                        p.CreatedDate 
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
                var platform = await _unitOfWork.Platforms.GetByIdAsync(id);
                if (platform == null)
                {
                    return NotFound(new { message = "Platform not found" });
                }

                return Ok(new { 
                    message = "Platform retrieved successfully", 
                    data = new { 
                        platform.Id, 
                        platform.Name, 
                        platform.Description, 
                        platform.CreatedDate 
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