using Newtonsoft.Json;

namespace DomainLayer.ExternalApiModels
{
    public class IgdbGameModel
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonProperty("storyline")]
        public string Storyline { get; set; } = string.Empty;

        [JsonProperty("first_release_date")]
        public long? FirstReleaseDate { get; set; }

        [JsonProperty("rating")]
        public decimal? Rating { get; set; }

        [JsonProperty("rating_count")]
        public int? RatingCount { get; set; }

        [JsonProperty("aggregated_rating")]
        public decimal? AggregatedRating { get; set; }

        [JsonProperty("aggregated_rating_count")]
        public int? AggregatedRatingCount { get; set; }

        [JsonProperty("genres")]
        public List<IgdbGenre> Genres { get; set; } = new();

        [JsonProperty("platforms")]
        public List<IgdbPlatform> Platforms { get; set; } = new();

        [JsonProperty("screenshots")]
        public List<IgdbScreenshot> Screenshots { get; set; } = new();

        [JsonProperty("cover")]
        public IgdbCover? Cover { get; set; }

        [JsonProperty("websites")]
        public List<IgdbWebsite> Websites { get; set; } = new();

        [JsonProperty("involved_companies")]
        public List<IgdbInvolvedCompany> InvolvedCompanies { get; set; } = new();

        [JsonProperty("release_dates")]
        public List<IgdbReleaseDate> ReleaseDates { get; set; } = new();

        [JsonProperty("game_modes")]
        public List<IgdbGameMode> GameModes { get; set; } = new();

        [JsonProperty("themes")]
        public List<IgdbTheme> Themes { get; set; } = new();

        [JsonProperty("player_perspectives")]
        public List<IgdbPlayerPerspective> PlayerPerspectives { get; set; } = new();

        [JsonProperty("keywords")]
        public List<IgdbKeyword> Keywords { get; set; } = new();

        [JsonProperty("collection")]
        public IgdbCollection? Collection { get; set; }

        [JsonProperty("franchise")]
        public IgdbFranchise? Franchise { get; set; }

        [JsonProperty("slug")]
        public string Slug { get; set; } = string.Empty;

        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;

        [JsonProperty("category")]
        public int? Category { get; set; }

        [JsonProperty("time_to_beat")]
        public IgdbTimeToBeat? TimeToBeat { get; set; }

        [JsonProperty("language_supports")]
        public List<IgdbLanguageSupport> LanguageSupports { get; set; } = new();

        [JsonProperty("videos")]
        public List<IgdbVideo> Videos { get; set; } = new();

        [JsonProperty("artworks")]
        public List<IgdbArtwork> Artworks { get; set; } = new();

        [JsonProperty("updated_at")]
        public long? UpdatedAt { get; set; }

        public DateTime? ReleaseDate => FirstReleaseDate.HasValue 
            ? DateTimeOffset.FromUnixTimeSeconds(FirstReleaseDate.Value).DateTime 
            : null;

        public DateTime? LastUpdateDate => UpdatedAt.HasValue 
            ? DateTimeOffset.FromUnixTimeSeconds(UpdatedAt.Value).DateTime 
            : null;

        public bool IsEarlyAccess => ReleaseDates?.Any(rd => rd.IsEarlyAccess) == true;
    }

    public class IgdbGenre
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbPlatform
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("abbreviation")]
        public string Abbreviation { get; set; } = string.Empty;
    }

    public class IgdbScreenshot
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;

        [JsonProperty("image_id")]
        public string ImageId { get; set; } = string.Empty;

        [JsonProperty("width")]
        public int? Width { get; set; }

        [JsonProperty("height")]
        public int? Height { get; set; }

        public string FullUrl => !string.IsNullOrEmpty(ImageId) 
            ? $"https://images.igdb.com/igdb/image/upload/t_screenshot_med/{ImageId}.jpg" 
            : Url;

        public string ThumbUrl => !string.IsNullOrEmpty(ImageId) 
            ? $"https://images.igdb.com/igdb/image/upload/t_thumb/{ImageId}.jpg" 
            : Url;
    }

    public class IgdbCover
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;

        [JsonProperty("image_id")]
        public string ImageId { get; set; } = string.Empty;

        [JsonProperty("width")]
        public int? Width { get; set; }

        [JsonProperty("height")]
        public int? Height { get; set; }

        public string FullUrl => !string.IsNullOrEmpty(ImageId) 
            ? $"https://images.igdb.com/igdb/image/upload/t_cover_big/{ImageId}.jpg" 
            : Url;

        public string ThumbUrl => !string.IsNullOrEmpty(ImageId) 
            ? $"https://images.igdb.com/igdb/image/upload/t_thumb/{ImageId}.jpg" 
            : Url;
    }

    public class IgdbWebsite
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("category")]
        public int Category { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;
    }

    public class IgdbInvolvedCompany
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("company")]
        public IgdbCompany Company { get; set; } = new();

        [JsonProperty("developer")]
        public bool Developer { get; set; }

        [JsonProperty("publisher")]
        public bool Publisher { get; set; }
    }

    public class IgdbCompany
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbReleaseDate
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("date")]
        public long? Date { get; set; }

        [JsonProperty("platform")]
        public IgdbPlatform Platform { get; set; } = new();

        [JsonProperty("region")]
        public int Region { get; set; }

        [JsonProperty("status")]
        public int? Status { get; set; }

        public DateTime? ReleaseDate => Date.HasValue 
            ? DateTimeOffset.FromUnixTimeSeconds(Date.Value).DateTime 
            : null;

        public bool IsEarlyAccess => Status == 4;
    }

    public class IgdbGameMode
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbTheme
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbPlayerPerspective
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbKeyword
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbCollection
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbFranchise
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbTimeToBeat
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("normally")]
        public int? Normally { get; set; }

        [JsonProperty("completely")]
        public int? Completely { get; set; }

        [JsonProperty("game")]
        public int? GameId { get; set; }
    }

    public class IgdbLanguageSupport
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("language")]
        public IgdbLanguage Language { get; set; } = new();

        [JsonProperty("language_support_type")]
        public IgdbLanguageSupportType LanguageSupportType { get; set; } = new();
    }

    public class IgdbLanguage
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("native_name")]
        public string NativeName { get; set; } = string.Empty;

        [JsonProperty("locale")]
        public string Locale { get; set; } = string.Empty;
    }

    public class IgdbLanguageSupportType
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbVideo
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("video_id")]
        public string VideoId { get; set; } = string.Empty;

        public string YouTubeUrl => !string.IsNullOrEmpty(VideoId) 
            ? $"https://www.youtube.com/watch?v={VideoId}" 
            : string.Empty;

        public string ThumbnailUrl => !string.IsNullOrEmpty(VideoId) 
            ? $"https://img.youtube.com/vi/{VideoId}/maxresdefault.jpg" 
            : string.Empty;
    }

    public class IgdbArtwork
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; } = string.Empty;

        [JsonProperty("image_id")]
        public string ImageId { get; set; } = string.Empty;

        [JsonProperty("width")]
        public int? Width { get; set; }

        [JsonProperty("height")]
        public int? Height { get; set; }

        public string FullUrl => !string.IsNullOrEmpty(ImageId) 
            ? $"https://images.igdb.com/igdb/image/upload/t_1080p/{ImageId}.jpg" 
            : Url;

        public string ThumbUrl => !string.IsNullOrEmpty(ImageId) 
            ? $"https://images.igdb.com/igdb/image/upload/t_thumb/{ImageId}.jpg" 
            : Url;
    }
}