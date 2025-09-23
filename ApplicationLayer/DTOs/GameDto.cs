using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class GameDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public string? Publisher { get; set; }
        public string? Developer { get; set; }
        public int? MetacriticScore { get; set; }
        public string? CoverUrl { get; set; }
        public decimal AverageRating { get; set; }
        public int RatingCount { get; set; }
        public List<DomainLayer.Enums.Platform> Platforms { get; set; } = new List<DomainLayer.Enums.Platform>();
        public List<string> Genres { get; set; } = new List<string>();
        public List<string> Tags { get; set; } = new List<string>();
    }

    public class GameDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Summary { get; set; }
        public string? Storyline { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Developer { get; set; }
        public string? Publisher { get; set; }
        public bool IsEarlyAccess { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBSlug { get; set; }
        public string? IGDBUrl { get; set; }
        
        // Game Series
        public GameDetailSeriesDto? GameSeries { get; set; }
        
        // Ratings
        public double Rating { get; set; }
        public int TotalReviews { get; set; }
        
        // Community Interaction
        public int CommentCount { get; set; }
        public int LikeCount { get; set; }
        
        // Related Data
        public List<GameDetailPlatformDto> Platforms { get; set; } = new List<GameDetailPlatformDto>();
        public List<GameDetailGenreDto> Genres { get; set; } = new List<GameDetailGenreDto>();
        public List<GameDetailThemeDto> Themes { get; set; } = new List<GameDetailThemeDto>();
        public List<GameDetailModeDto> GameModes { get; set; } = new List<GameDetailModeDto>();
        public List<GameDetailPlayerPerspectiveDto> PlayerPerspectives { get; set; } = new List<GameDetailPlayerPerspectiveDto>();
        public List<GameDetailKeywordDto> Keywords { get; set; } = new List<GameDetailKeywordDto>();
        public List<GameDetailCompanyDto> Companies { get; set; } = new List<GameDetailCompanyDto>();
        public List<GameDetailWebsiteDto> Websites { get; set; } = new List<GameDetailWebsiteDto>();
        public List<string> Screenshots { get; set; } = new List<string>();
        public List<string> Videos { get; set; } = new List<string>();
        public List<GameDetailMediaDto> GameMedia { get; set; } = new List<GameDetailMediaDto>();
        
        // Beat Times
        public GameDetailBeatTimeDto? BeatTimes { get; set; }
        
        // IGDB Rating
        public GameDetailIgdbRatingDto? IgdbRating { get; set; }
        
        // Recent Reviews
        public List<GameDetailReviewDto> Reviews { get; set; } = new List<GameDetailReviewDto>();
    }
    
    public class GameDetailPlatformDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    
    public class GameDetailGenreDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    
    public class GameDetailThemeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    
    public class GameDetailModeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    
    public class GameDetailPlayerPerspectiveDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    
    public class GameDetailKeywordDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    
    public class GameDetailCompanyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
    
    public class GameDetailWebsiteDto
    {
        public int Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Name { get; set; }
    }
    
    public class GameDetailBeatTimeDto
    {
        public int? MainStory { get; set; } // in hours
        public int? MainPlusExtras { get; set; } // in hours
        public int? Completionist { get; set; } // in hours
        public int? AllStyles { get; set; } // in hours
    }
    
    public class GameDetailIgdbRatingDto
    {
        public double? UserRating { get; set; }
        public int? UserRatingCount { get; set; }
        public double? CriticRating { get; set; }
        public int? CriticRatingCount { get; set; }
    }
    
    public class GameDetailReviewDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string? Review { get; set; }
        public DateTime CreatedDate { get; set; }
        public GameDetailUserDto User { get; set; } = new GameDetailUserDto();
    }
    
    public class GameDetailUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
    }

    public class GameDetailMediaDto
    {
        public int Id { get; set; }
        public int MediaType { get; set; } // 1=Image, 2=Video, 3=Screenshot, 4=Cover, 5=Artwork, 6=Logo
        public string Url { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public bool IsPrimary { get; set; }
    }

    public class GameDetailSeriesDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateGameDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public string? Publisher { get; set; }
        public string? Developer { get; set; }
        public int? MetacriticScore { get; set; }
        public int? IGDBId { get; set; }
        public string? CoverUrl { get; set; }
        public List<DomainLayer.Enums.Platform> Platforms { get; set; } = new List<DomainLayer.Enums.Platform>();
        public List<int> GenreIds { get; set; } = new List<int>();
        public List<int> TagIds { get; set; } = new List<int>();
    }

    public class UpdateGameDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public string? Publisher { get; set; }
        public string? Developer { get; set; }
        public int? MetacriticScore { get; set; }
        public string? CoverUrl { get; set; }
        public List<DomainLayer.Enums.Platform>? Platforms { get; set; }
        public List<int>? GenreIds { get; set; }
        public int? GameSeriesId { get; set; }
        public List<int>? TagIds { get; set; }
    }
}