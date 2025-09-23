using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Interfaces;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThemesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public ThemesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var themes = await _unitOfWork.Themes.GetAllAsync();
                return Ok(new { 
                    message = "Themes retrieved successfully", 
                    data = themes.Select(t => new { 
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
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var theme = await _unitOfWork.Themes.GetByIdAsync(id);
                if (theme == null)
                {
                    return NotFound(new { message = "Theme not found" });
                }

                return Ok(new { 
                    message = "Theme retrieved successfully", 
                    data = new { 
                        theme.Id, 
                        theme.Name, 
                        theme.Description, 
                        theme.CreatedDate 
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