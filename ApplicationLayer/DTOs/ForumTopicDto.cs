using System.Collections.Generic;

namespace ApplicationLayer.DTOs
{
    public class ForumTopicDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int UserId { get; set; }
        public UserDto? User { get; set; }
        public int ForumCategoryId { get; set; }
        public ForumCategoryDto? ForumCategory { get; set; }
        public int? GameId { get; set; }
        public GameDto? Game { get; set; }
        public bool IsSticky { get; set; }
        public bool IsPinned { get; set; }
        public bool IsLocked { get; set; }
        public bool IsPublished { get; set; }
        public int ViewCount { get; set; }
        public int ReplyCount { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }

    public class CreateForumTopicDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int UserId { get; set; }
        public int ForumCategoryId { get; set; }
        public int? GameId { get; set; }
        public List<string>? Tags { get; set; }
        public bool IsSticky { get; set; } = false;
    }

    public class UpdateForumTopicDto
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public int? CategoryId { get; set; }
        public int? ForumCategoryId { get; set; }
        public int? GameId { get; set; }
        public List<string>? Tags { get; set; }
        public bool? IsSticky { get; set; }
        public bool? IsLocked { get; set; }
    }
}