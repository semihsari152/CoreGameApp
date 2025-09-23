using ApplicationLayer.Services;
using DomainLayer.Entities;
using DomainLayer.Enums;
using DomainLayer.ExternalApiModels;
using DomainLayer.Interfaces;
using Microsoft.EntityFrameworkCore;
using PlatformEntity = DomainLayer.Entities.Platform;
using PlatformEnum = DomainLayer.Enums.Platform;

namespace InfrastructureLayer.Services
{
    public class GameRelationSyncService : IGameRelationSyncService
    {
        private readonly IUnitOfWork _unitOfWork;

        public GameRelationSyncService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task SyncGameRelationsFromIgdbAsync(int gameId, IgdbGameModel igdbGame)
        {
            await SyncGenresAsync(gameId, igdbGame.Genres);
            await SyncGameModesAsync(gameId, igdbGame.GameModes);
            await SyncKeywordsAsync(gameId, igdbGame.Keywords);
            // Language support removed as per refactoring requirements
            await SyncMediaAsync(gameId, igdbGame);
            await SyncPlatformsAsync(gameId, igdbGame.Platforms);
            await SyncGameSeriesAsync(gameId, igdbGame.Collection, igdbGame.Franchise);
            await SyncThemesAsync(gameId, igdbGame.Themes);
            await SyncWebsitesAsync(gameId, igdbGame.Websites);
        }

        public async Task SyncGenresAsync(int gameId, IEnumerable<IgdbGenre> igdbGenres)
        {
            var existingGameGenres = await _unitOfWork.Repository<GameGenre>()
                .GetAllAsync(gg => gg.GameId == gameId);

            foreach (var gameGenre in existingGameGenres)
            {
                await _unitOfWork.Repository<GameGenre>().DeleteAsync(gameGenre);
            }

            foreach (var igdbGenre in igdbGenres)
            {
                var existingGenre = await _unitOfWork.Repository<Genre>()
                    .GetFirstOrDefaultAsync(g => g.IGDBId == igdbGenre.Id);

                if (existingGenre == null)
                {
                    existingGenre = new Genre
                    {
                        Name = igdbGenre.Name,
                        IGDBId = igdbGenre.Id,
                        IGDBName = igdbGenre.Name,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<Genre>().AddAsync(existingGenre);
                    await _unitOfWork.SaveAsync();
                }

                var gameGenre = new GameGenre
                {
                    GameId = gameId,
                    GenreId = existingGenre.Id
                };
                await _unitOfWork.Repository<GameGenre>().AddAsync(gameGenre);
            }

            await _unitOfWork.SaveAsync();
        }

        public async Task SyncGameModesAsync(int gameId, IEnumerable<IgdbGameMode> igdbGameModes)
        {
            var existingGameModes = await _unitOfWork.Repository<GameGameMode>()
                .GetAllAsync(gm => gm.GameId == gameId);

            foreach (var gameMode in existingGameModes)
            {
                await _unitOfWork.Repository<GameGameMode>().DeleteAsync(gameMode);
            }

            foreach (var igdbGameMode in igdbGameModes)
            {
                var existingGameMode = await _unitOfWork.Repository<GameMode>()
                    .GetFirstOrDefaultAsync(gm => gm.IGDBId == igdbGameMode.Id);

                if (existingGameMode == null)
                {
                    existingGameMode = new GameMode
                    {
                        Name = igdbGameMode.Name,
                        IGDBId = igdbGameMode.Id,
                        IGDBName = igdbGameMode.Name,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<GameMode>().AddAsync(existingGameMode);
                    await _unitOfWork.SaveAsync();
                }

                var gameGameMode = new GameGameMode
                {
                    GameId = gameId,
                    GameModeId = existingGameMode.Id
                };
                await _unitOfWork.Repository<GameGameMode>().AddAsync(gameGameMode);
            }

            await _unitOfWork.SaveAsync();
        }

        public async Task SyncKeywordsAsync(int gameId, IEnumerable<IgdbKeyword> igdbKeywords)
        {
            var existingGameKeywords = await _unitOfWork.Repository<GameKeyword>()
                .GetAllAsync(gk => gk.GameId == gameId);

            foreach (var gameKeyword in existingGameKeywords)
            {
                await _unitOfWork.Repository<GameKeyword>().DeleteAsync(gameKeyword);
            }

            foreach (var igdbKeyword in igdbKeywords)
            {
                var existingKeyword = await _unitOfWork.Repository<Keyword>()
                    .GetFirstOrDefaultAsync(k => k.IGDBId == igdbKeyword.Id);

                if (existingKeyword == null)
                {
                    existingKeyword = new Keyword
                    {
                        Name = igdbKeyword.Name,
                        IGDBId = igdbKeyword.Id,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<Keyword>().AddAsync(existingKeyword);
                    await _unitOfWork.SaveAsync();
                }

                var gameKeyword = new GameKeyword
                {
                    GameId = gameId,
                    KeywordId = existingKeyword.Id
                };
                await _unitOfWork.Repository<GameKeyword>().AddAsync(gameKeyword);
            }

            await _unitOfWork.SaveAsync();
        }

        // SyncLanguagesAsync method removed as Language entity support has been removed

        public async Task SyncMediaAsync(int gameId, IgdbGameModel igdbGame)
        {
            var existingGameMedia = await _unitOfWork.Repository<GameMedia>()
                .GetAllAsync(gm => gm.GameId == gameId);

            foreach (var gameMedia in existingGameMedia)
            {
                await _unitOfWork.Repository<GameMedia>().DeleteAsync(gameMedia);
            }

            // Cover image
            if (igdbGame.Cover != null)
            {
                var coverMedia = new GameMedia
                {
                    GameId = gameId,
                    MediaType = MediaType.Cover,
                    Url = igdbGame.Cover.FullUrl,
                    ThumbnailUrl = igdbGame.Cover.ThumbUrl,
                    Title = "Cover Image",
                    IGDBId = igdbGame.Cover.Id,
                    Width = igdbGame.Cover.Width,
                    Height = igdbGame.Cover.Height,
                    IsPrimary = true
                };
                await _unitOfWork.Repository<GameMedia>().AddAsync(coverMedia);
            }

            // Screenshots
            foreach (var screenshot in igdbGame.Screenshots)
            {
                var screenshotMedia = new GameMedia
                {
                    GameId = gameId,
                    MediaType = MediaType.Screenshot,
                    Url = screenshot.FullUrl,
                    ThumbnailUrl = screenshot.ThumbUrl,
                    Title = "Screenshot",
                    IGDBId = screenshot.Id,
                    Width = screenshot.Width,
                    Height = screenshot.Height
                };
                await _unitOfWork.Repository<GameMedia>().AddAsync(screenshotMedia);
            }

            // Videos
            foreach (var video in igdbGame.Videos)
            {
                var videoMedia = new GameMedia
                {
                    GameId = gameId,
                    MediaType = MediaType.Video,
                    Url = video.YouTubeUrl,
                    ThumbnailUrl = video.ThumbnailUrl,
                    Title = video.Name,
                    IGDBId = video.Id
                };
                await _unitOfWork.Repository<GameMedia>().AddAsync(videoMedia);
            }

            // Artworks
            foreach (var artwork in igdbGame.Artworks)
            {
                var artworkMedia = new GameMedia
                {
                    GameId = gameId,
                    MediaType = MediaType.Artwork,
                    Url = artwork.FullUrl,
                    ThumbnailUrl = artwork.ThumbUrl,
                    Title = "Artwork",
                    IGDBId = artwork.Id,
                    Width = artwork.Width,
                    Height = artwork.Height
                };
                await _unitOfWork.Repository<GameMedia>().AddAsync(artworkMedia);
            }

            await _unitOfWork.SaveAsync();
        }

        public async Task SyncPlatformsAsync(int gameId, IEnumerable<IgdbPlatform> igdbPlatforms)
        {
            var existingGamePlatforms = await _unitOfWork.Repository<GamePlatform>()
                .GetAllAsync(gp => gp.GameId == gameId);

            foreach (var gamePlatform in existingGamePlatforms)
            {
                await _unitOfWork.Repository<GamePlatform>().DeleteAsync(gamePlatform);
            }

            foreach (var igdbPlatform in igdbPlatforms)
            {
                var existingPlatform = await _unitOfWork.Repository<PlatformEntity>()
                    .GetFirstOrDefaultAsync(p => p.IGDBId == igdbPlatform.Id);

                if (existingPlatform == null)
                {
                    existingPlatform = new PlatformEntity
                    {
                        Name = igdbPlatform.Name,
                        IGDBId = igdbPlatform.Id,
                        IGDBName = igdbPlatform.Name,
                        Abbreviation = igdbPlatform.Abbreviation,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<PlatformEntity>().AddAsync(existingPlatform);
                    await _unitOfWork.SaveAsync();
                }

                var gamePlatform = new GamePlatform
                {
                    GameId = gameId,
                    PlatformId = existingPlatform.Id
                };
                await _unitOfWork.Repository<GamePlatform>().AddAsync(gamePlatform);
            }

            await _unitOfWork.SaveAsync();
        }

        public async Task SyncGameSeriesAsync(int gameId, IgdbCollection? igdbCollection, IgdbFranchise? igdbFranchise)
        {
            if (igdbCollection == null && igdbFranchise == null) return;

            var seriesName = igdbCollection?.Name ?? igdbFranchise?.Name ?? "";
            var seriesIgdbId = igdbCollection?.Id ?? igdbFranchise?.Id ?? 0;

            if (string.IsNullOrEmpty(seriesName) || seriesIgdbId == 0) return;

            var existingGameSeries = await _unitOfWork.Repository<GameSeries>()
                .GetFirstOrDefaultAsync(gs => gs.IGDBId == seriesIgdbId);

            if (existingGameSeries == null)
            {
                existingGameSeries = new GameSeries
                {
                    Name = seriesName,
                    IGDBId = seriesIgdbId,
                    IGDBName = seriesName,
                    CreatedDate = DateTime.UtcNow
                };
                await _unitOfWork.Repository<GameSeries>().AddAsync(existingGameSeries);
                await _unitOfWork.SaveAsync();
            }

            var game = await _unitOfWork.Repository<Game>().GetByIdAsync(gameId);
            if (game != null)
            {
                game.GameSeriesId = existingGameSeries.Id;
                await _unitOfWork.Repository<Game>().UpdateAsync(game);
                await _unitOfWork.SaveAsync();
            }
        }

        public async Task SyncThemesAsync(int gameId, IEnumerable<IgdbTheme> igdbThemes)
        {
            var existingGameThemes = await _unitOfWork.Repository<GameTheme>()
                .GetAllAsync(gt => gt.GameId == gameId);

            foreach (var gameTheme in existingGameThemes)
            {
                await _unitOfWork.Repository<GameTheme>().DeleteAsync(gameTheme);
            }

            foreach (var igdbTheme in igdbThemes)
            {
                var existingTheme = await _unitOfWork.Repository<Theme>()
                    .GetFirstOrDefaultAsync(t => t.IGDBId == igdbTheme.Id);

                if (existingTheme == null)
                {
                    existingTheme = new Theme
                    {
                        Name = igdbTheme.Name,
                        IGDBId = igdbTheme.Id,
                        IGDBName = igdbTheme.Name,
                        CreatedDate = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<Theme>().AddAsync(existingTheme);
                    await _unitOfWork.SaveAsync();
                }

                var gameTheme = new GameTheme
                {
                    GameId = gameId,
                    ThemeId = existingTheme.Id
                };
                await _unitOfWork.Repository<GameTheme>().AddAsync(gameTheme);
            }

            await _unitOfWork.SaveAsync();
        }

        public async Task SyncWebsitesAsync(int gameId, IEnumerable<IgdbWebsite> igdbWebsites)
        {
            var existingGameWebsites = await _unitOfWork.Repository<GameWebsite>()
                .GetAllAsync(gw => gw.GameId == gameId);

            foreach (var gameWebsite in existingGameWebsites)
            {
                await _unitOfWork.Repository<GameWebsite>().DeleteAsync(gameWebsite);
            }

            foreach (var igdbWebsite in igdbWebsites)
            {
                var websiteType = GetWebsiteType(igdbWebsite.Category);
                var gameWebsite = new GameWebsite
                {
                    GameId = gameId,
                    WebsiteType = websiteType,
                    Url = igdbWebsite.Url,
                    Name = GetWebsiteTypeName(igdbWebsite.Category),
                    IGDBId = igdbWebsite.Id
                };
                await _unitOfWork.Repository<GameWebsite>().AddAsync(gameWebsite);
            }

            await _unitOfWork.SaveAsync();
        }

        private WebsiteType GetWebsiteType(int category)
        {
            return category switch
            {
                1 => WebsiteType.Official,
                2 => WebsiteType.Wikia,
                3 => WebsiteType.Wikipedia,
                4 => WebsiteType.Facebook,
                5 => WebsiteType.Twitter,
                6 => WebsiteType.Twitch,
                8 => WebsiteType.Instagram,
                9 => WebsiteType.YouTube,
                10 => WebsiteType.iPhone,
                11 => WebsiteType.iPad,
                12 => WebsiteType.Android,
                13 => WebsiteType.Steam,
                14 => WebsiteType.Reddit,
                15 => WebsiteType.Itch,
                16 => WebsiteType.EpicGames,
                17 => WebsiteType.GOG,
                18 => WebsiteType.Discord,
                _ => WebsiteType.Other
            };
        }

        private string GetWebsiteTypeName(int category)
        {
            return category switch
            {
                1 => "Official Site",
                2 => "Wikia",
                3 => "Wikipedia",
                4 => "Facebook",
                5 => "Twitter",
                6 => "Twitch",
                8 => "Instagram",
                9 => "YouTube",
                10 => "App Store",
                11 => "iPad App Store",
                12 => "Google Play",
                13 => "Steam",
                14 => "Reddit",
                15 => "Itch.io",
                16 => "Epic Games Store",
                17 => "GOG",
                18 => "Discord",
                _ => "Other"
            };
        }
    }
}