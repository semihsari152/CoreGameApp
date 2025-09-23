using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;
using DomainLayer.Enums;
using System.Security.Claims;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto createDto)
        {
            try
            {
                // Try different claim types
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
                               ?? User.FindFirst("sub") 
                               ?? User.FindFirst("userId") 
                               ?? User.FindFirst("id");
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int reporterId))
                {
                    return Unauthorized("User ID not found in token");
                }
                
                // Check if user has already reported this entity
                var hasReported = await _reportService.HasUserReportedEntityAsync(reporterId, createDto.ReportableType, createDto.ReportableEntityId);
                if (hasReported)
                {
                    return BadRequest(new { message = "Bu öğeyi zaten bildirdiniz" });
                }

                var result = await _reportService.CreateReportAsync(reporterId, createDto);
                
                return Ok(new { message = "Bildirim başarıyla gönderildi", data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("my-reports")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetMyReports()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var reports = await _reportService.GetUserReportsAsync(userId);
                
                return Ok(new { message = "Bildirimlerim", data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("check/{reportableType}/{entityId}")]
        [Authorize]
        public async Task<ActionResult<bool>> CheckIfReported(ReportableType reportableType, int entityId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var hasReported = await _reportService.HasUserReportedEntityAsync(userId, reportableType, entityId);
                
                return Ok(new { message = "Bildirim kontrolü", data = hasReported });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Admin endpoints
        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetPendingReports()
        {
            try
            {
                var reports = await _reportService.GetPendingReportsAsync();
                return Ok(new { message = "Bekleyen bildirimler", data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("pending/count")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<int>> GetPendingReportsCount()
        {
            try
            {
                var count = await _reportService.GetPendingReportsCountAsync();
                return Ok(new { message = "Bekleyen bildirim sayısı", data = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("status/{status}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetReportsByStatus(ReportStatus status)
        {
            try
            {
                var reports = await _reportService.GetReportsByStatusAsync(status);
                return Ok(new { message = $"{status} durumundaki bildirimler", data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<ReportDto>> GetReportById(int id)
        {
            try
            {
                var report = await _reportService.GetReportByIdAsync(id);
                return Ok(new { message = "Bildirim detayları", data = report });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("entity/{reportableType}/{entityId}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetReportsForEntity(ReportableType reportableType, int entityId)
        {
            try
            {
                var reports = await _reportService.GetReportsForEntityAsync(reportableType, entityId);
                return Ok(new { message = "Öğe için bildirimler", data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}/review")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> ReviewReport(int id, [FromBody] ReviewReportDto reviewDto)
        {
            try
            {
                var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                if (reviewDto.Status == ReportStatus.Approved)
                {
                    await _reportService.ApproveReportAsync(id, reviewerId, reviewDto.ReviewNotes);
                }
                else if (reviewDto.Status == ReportStatus.Rejected)
                {
                    await _reportService.RejectReportAsync(id, reviewerId, reviewDto.ReviewNotes);
                }
                else
                {
                    await _reportService.ReviewReportAsync(id, reviewDto, reviewerId);
                }
                
                return Ok(new { message = "Bildirim değerlendirildi" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> ApproveReport(int id, [FromBody] AdminActionDto actionDto)
        {
            try
            {
                var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _reportService.ApproveReportAsync(id, reviewerId, actionDto.Notes);
                
                return Ok(new { message = "Bildirim onaylandı" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> RejectReport(int id, [FromBody] AdminActionDto actionDto)
        {
            try
            {
                var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _reportService.RejectReportAsync(id, reviewerId, actionDto.Notes);
                
                return Ok(new { message = "Bildirim reddedildi" });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("recent/{count}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetRecentReports(int count)
        {
            try
            {
                var reports = await _reportService.GetRecentReportsAsync(count);
                return Ok(new { message = $"Son {count} bildirim", data = reports });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Frontend expects GET /reports with filters
        [HttpGet]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<object>> GetAllReports(
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? status = null,
            [FromQuery] string? reportType = null,
            [FromQuery] string? reportableType = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var filters = new
                {
                    searchTerm,
                    status,
                    reportType,
                    reportableType,
                    page,
                    pageSize
                };

                var reports = await _reportService.GetAllReportsAsync(filters);
                return Ok(new { message = "Tüm raporlar", data = reports.data, totalCount = reports.totalCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Update endpoint to match frontend expectations
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UpdateReport(int id, [FromBody] UpdateReportDto updateDto)
        {
            try
            {
                var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _reportService.UpdateReportAsync(id, updateDto, reviewerId);
                
                return Ok(new { message = "Rapor güncellendi", data = result });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Status update endpoint
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> UpdateReportStatus(int id, [FromBody] UpdateStatusDto statusDto)
        {
            try
            {
                var reviewerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _reportService.UpdateReportStatusAsync(id, statusDto.Status, reviewerId);
                
                return Ok(new { message = "Rapor durumu güncellendi", data = result });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Frontend expects /reports/my endpoint
        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetMyReportsEndpoint()
        {
            return await GetMyReports();
        }
    }

    // Helper DTOs
    public class AdminActionDto
    {
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}