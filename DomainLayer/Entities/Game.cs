using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class Game
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string? Summary { get; set; }
        public string? Description { get; set; }
        public string? Storyline { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public bool IsEarlyAccess { get; set; } = false;
        public int? GameSeriesId { get; set; }
        
        // IGDB Data
        public int? IGDBId { get; set; }
        
        
        // IGDB Additional Data
        public string? IGDBSlug { get; set; }
        public string? IGDBUrl { get; set; }
        public DateTime? IGDBLastUpdated { get; set; }
        public DateTime? IGDBLastSync { get; set; }
        
        // Game Media
        public string? CoverImageId { get; set; }
        public string? CoverImageUrl { get; set; }
        
        // HowLongToBeat Data is now in separate GameBeatTime table
        
        // Backwards Compatibility
        public string? Developer { get; set; }
        public string? Publisher { get; set; }
        public bool IsDataComplete { get; set; } = false;
        
        // Tracking
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties - Core Data
        public virtual GameSeries? GameSeries { get; set; }
        public virtual ICollection<GameGenre> GameGenres { get; set; } = new List<GameGenre>();
        public virtual ICollection<GameTheme> GameThemes { get; set; } = new List<GameTheme>();
        public virtual ICollection<GameGameMode> GameGameModes { get; set; } = new List<GameGameMode>();
        public virtual ICollection<GamePlayerPerspective> GamePlayerPerspectives { get; set; } = new List<GamePlayerPerspective>();
        public virtual ICollection<GamePlatform> GamePlatforms { get; set; } = new List<GamePlatform>();
        public virtual ICollection<GameKeyword> GameKeywords { get; set; } = new List<GameKeyword>();
        public virtual ICollection<GameWebsite> GameWebsites { get; set; } = new List<GameWebsite>();
        public virtual ICollection<GameMedia> GameMedia { get; set; } = new List<GameMedia>();
        
        // Developer/Publisher Relations
        public virtual ICollection<GameCompany> GameCompanies { get; set; } = new List<GameCompany>();
        
        // Community Features
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Guide> Guides { get; set; } = new List<Guide>();
        public virtual ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
        public virtual ICollection<UserGameStatus> UserGameStatuses { get; set; } = new List<UserGameStatus>();
        public virtual ICollection<GameRating> GameRatings { get; set; } = new List<GameRating>();
        
        // HowLongToBeat Data
        public virtual GameBeatTime? GameBeatTime { get; set; }
        
        // IGDB Rating Data
        public virtual GameIgdbRating? GameIgdbRating { get; set; }
        
    }
}