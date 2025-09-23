using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ApplicationLayer.Services;
using ApplicationLayer.DTOs;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameSeriesController : ControllerBase
    {
        private readonly IGameSeriesService _gameSeriesService;

        public GameSeriesController(IGameSeriesService gameSeriesService)
        {
            _gameSeriesService = gameSeriesService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GameSeriesDto>>> GetAllGameSeries()
        {
            try
            {
                var gameSeries = await _gameSeriesService.GetAllGameSeriesAsync();
                return Ok(new { message = "Oyun serileri başarıyla getirildi", data = gameSeries });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GameSeriesDto>> GetGameSeriesById(int id)
        {
            try
            {
                var gameSeries = await _gameSeriesService.GetGameSeriesByIdAsync(id);
                if (gameSeries == null)
                    return NotFound(new { message = "Oyun serisi bulunamadı" });

                return Ok(new { message = "Oyun serisi başarıyla getirildi", data = gameSeries });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<GameSeriesDto>>> SearchGameSeries([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    var allSeries = await _gameSeriesService.GetAllGameSeriesAsync();
                    return Ok(new { message = "Tüm oyun serileri getirildi", data = allSeries });
                }

                var gameSeries = await _gameSeriesService.SearchGameSeriesAsync(query);
                return Ok(new { message = "Arama tamamlandı", data = gameSeries });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<GameSeriesDto>> CreateGameSeries([FromBody] CreateGameSeriesDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var gameSeries = await _gameSeriesService.CreateGameSeriesAsync(createDto);
                return CreatedAtAction(nameof(GetGameSeriesById), 
                    new { id = gameSeries.Id }, 
                    new { message = "Oyun serisi başarıyla oluşturuldu", data = gameSeries });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<GameSeriesDto>> UpdateGameSeries(int id, [FromBody] UpdateGameSeriesDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var gameSeries = await _gameSeriesService.UpdateGameSeriesAsync(id, updateDto);
                return Ok(new { message = "Oyun serisi başarıyla güncellendi", data = gameSeries });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteGameSeries(int id)
        {
            try
            {
                var result = await _gameSeriesService.DeleteGameSeriesAsync(id);
                if (!result)
                    return NotFound(new { message = "Oyun serisi bulunamadı" });

                return Ok(new { message = "Oyun serisi başarıyla silindi" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("check-name/{name}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<bool>> CheckNameExists(string name)
        {
            try
            {
                var exists = await _gameSeriesService.ExistsByNameAsync(name);
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}