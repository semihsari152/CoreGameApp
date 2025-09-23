using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Interfaces;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KeywordsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public KeywordsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var keywords = await _unitOfWork.Keywords.GetAllAsync();
                return Ok(new { 
                    message = "Keywords retrieved successfully", 
                    data = keywords.Select(k => new { 
                        k.Id, 
                        k.Name, 
                        k.CreatedDate 
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
                var keyword = await _unitOfWork.Keywords.GetByIdAsync(id);
                if (keyword == null)
                {
                    return NotFound(new { message = "Keyword not found" });
                }

                return Ok(new { 
                    message = "Keyword retrieved successfully", 
                    data = new { 
                        keyword.Id, 
                        keyword.Name, 
                        keyword.CreatedDate 
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