namespace ApplicationLayer.DTOs
{
    public class BlogCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public int Order { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }
    public class BlogPostDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int UserId { get; set; }
        public UserDto? User { get; set; }
        public UserDto? Author { get; set; }
        public int? GameId { get; set; }
        public GameDto? Game { get; set; }
        public int? CategoryId { get; set; }
        public BlogCategoryDto? Category { get; set; }
        public bool IsPublished { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateBlogPostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int? GameId { get; set; } // Optional - for game-specific blog posts
        public bool IsPublished { get; set; } = true;
        public int CategoryId { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
    }

    public class UpdateBlogPostDto
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Summary { get; set; }
        public string? CoverImageUrl { get; set; }
        public int? GameId { get; set; }
        public int? CategoryId { get; set; }
        public List<string>? Tags { get; set; }
        public bool? IsPublished { get; set; }
    }
}