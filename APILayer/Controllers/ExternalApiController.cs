using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DomainLayer.Interfaces;
using InfrastructureLayer.Services;
using ApplicationLayer.DTOs;
using ApplicationLayer.Services;

namespace APILayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExternalApiController : ControllerBase
    {
        private readonly IIgdbApiService _igdbApiService;
        private readonly IIgdbGameImportService _igdbGameImportService;
        private readonly IStaticDataService _staticDataService;
        private readonly IGameService _gameService;

        public ExternalApiController(
            IIgdbApiService igdbApiService,
            IIgdbGameImportService igdbGameImportService,
            IStaticDataService staticDataService,
            IGameService gameService)
        {
            _igdbApiService = igdbApiService;
            _igdbGameImportService = igdbGameImportService;
            _staticDataService = staticDataService;
            _gameService = gameService;
        }


        [HttpPost("add-game/{igdbId}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> AddGameFromIgdb(int igdbId)
        {
            try
            {
                var game = await _igdbGameImportService.ImportGameByIgdbIdAsync(igdbId);
                return Ok(new { 
                    message = "Oyun başarıyla eklendi", 
                    data = new { 
                        Id = game.Id, 
                        Name = game.Name, 
                        IGDBId = game.IGDBId,
                        Summary = game.Summary,
                        Storyline = game.Storyline,
                        ReleaseDate = game.ReleaseDate,
                        IsEarlyAccess = game.IsEarlyAccess,
                        IgdbRating = game.GameIgdbRating != null ? new {
                            UserRating = game.GameIgdbRating.UserRating,
                            UserRatingDisplay = game.GameIgdbRating.UserRatingDisplay,
                            UserRatingCount = game.GameIgdbRating.UserRatingCount,
                            CriticRating = game.GameIgdbRating.CriticRating,
                            CriticRatingDisplay = game.GameIgdbRating.CriticRatingDisplay,
                            CriticRatingCount = game.GameIgdbRating.CriticRatingCount
                        } : null,
                        CoverImageId = game.CoverImageId,
                        IGDBLastUpdated = game.IGDBLastUpdated,
                        GameSeriesId = game.GameSeriesId,
                        BeatTime = game.GameBeatTime != null ? new {
                            Main = new {
                                Hours = game.GameBeatTime.MainHours,
                                AvgSeconds = game.GameBeatTime.MainAvgSeconds,
                                PolledCount = game.GameBeatTime.MainPolledCount
                            },
                            Extra = new {
                                Hours = game.GameBeatTime.ExtraHours,
                                AvgSeconds = game.GameBeatTime.ExtraAvgSeconds,
                                PolledCount = game.GameBeatTime.ExtraPolledCount
                            },
                            Completionist = new {
                                Hours = game.GameBeatTime.CompletionistHours,
                                AvgSeconds = game.GameBeatTime.CompletionistAvgSeconds,
                                PolledCount = game.GameBeatTime.CompletionistPolledCount
                            },
                            All = new {
                                Hours = game.GameBeatTime.AllHours,
                                AvgSeconds = game.GameBeatTime.AllAvgSeconds,
                                PolledCount = game.GameBeatTime.AllPolledCount
                            }
                        } : null
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                var errorMessage = ex.Message;
                var innerException = ex.InnerException?.Message;
                if (innerException != null)
                {
                    errorMessage += " Inner: " + innerException;
                }
                return StatusCode(500, new { message = "Oyun eklenirken bir hata oluştu", error = errorMessage });
            }
        }

        [HttpGet("check-game/{gameId}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> CheckGameData(int gameId)
        {
            try
            {
                var game = await _gameService.GetGameByIdAsync(gameId);
                if (game == null)
                {
                    return NotFound(new { message = "Oyun bulunamadı" });
                }

                return Ok(new { 
                    message = "Oyun verileri",
                    data = game
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Hata oluştu", error = ex.Message });
            }
        }
    }

    public class ImportGameRequest
    {
        public int IgdbId { get; set; }
    }
}