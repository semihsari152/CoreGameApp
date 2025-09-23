namespace DomainLayer.Entities
{
    public class BlogPost
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? CoverImageUrl { get; set; }
        public int UserId { get; set; }
        public int? GameId { get; set; }  // Optional - for game-specific blog posts
        public int? CategoryId { get; set; }  // Optional - for blog category
        public bool IsPublished { get; set; } = false;
        public int ViewCount { get; set; } = 0;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual Game? Game { get; set; }  // Navigation property for game-specific blog posts
        public virtual BlogCategory? Category { get; set; }  // Navigation property for blog category
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
        public virtual ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
    }
}