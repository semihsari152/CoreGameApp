using ApplicationLayer.DTOs.Guide;

namespace ApplicationLayer.DTOs
{
    public class GuideDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? Content { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? TableOfContents { get; set; }
        public int? GameId { get; set; }
        public GameDto? Game { get; set; }
        public int UserId { get; set; }
        public UserDto? User { get; set; }
        public bool IsPublished { get; set; }
        public bool IsFeatured { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public int? GuideCategoryId { get; set; }
        public GuideCategoryDto? GuideCategory { get; set; }
        public List<string> Tags { get; set; } = new();
        public decimal AverageRating { get; set; }
        public decimal Rating { get; set; }
        public int RatingCount { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<Guide.GuideBlockDto> GuideBlocks { get; set; } = new();
    }


    public class UpdateGuideDto
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? ThumbnailUrl { get; set; }
        public bool? IsPublished { get; set; }
        public bool? IsFeatured { get; set; }
        public string? Difficulty { get; set; }
        public int? GuideCategoryId { get; set; }
        public List<int>? TagIds { get; set; }
        public List<string>? Tags { get; set; } // Frontend'den string array olarak geliyor
        public List<Guide.UpdateGuideBlockDto>? GuideBlocks { get; set; }
    }
}