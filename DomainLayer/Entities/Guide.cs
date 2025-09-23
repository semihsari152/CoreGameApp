namespace DomainLayer.Entities
{
    public class Guide
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? ThumbnailUrl { get; set; }      // Guide cover image
        public string? TableOfContents { get; set; }    // JSON for auto-generated TOC
        public int? GameId { get; set; }
        public int UserId { get; set; }
        public bool IsPublished { get; set; } = false;
        public bool IsFeatured { get; set; } = false;   // Featured guides
        public string Difficulty { get; set; } = string.Empty;  // 5 different levels - Required
        public int? GuideCategoryId { get; set; }        // FK to GuideCategory
        public decimal AverageRating { get; set; } = 0;
        public int RatingCount { get; set; } = 0;
        public int ViewCount { get; set; } = 0;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual Game? Game { get; set; }
        public virtual User User { get; set; } = null!;
        public virtual GuideCategory? GuideCategory { get; set; }
        public virtual ICollection<GuideBlock> GuideBlocks { get; set; } = new List<GuideBlock>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
        public virtual ICollection<GuideTag> GuideTags { get; set; } = new List<GuideTag>();
    }
}