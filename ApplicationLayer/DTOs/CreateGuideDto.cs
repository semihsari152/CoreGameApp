using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class CreateGuideDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int? GameId { get; set; }
        public int UserId { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public int? GuideCategoryId { get; set; }
        public List<CreateGuideBlockDto> GuideBlocks { get; set; } = new List<CreateGuideBlockDto>();
        public List<string> Tags { get; set; } = new List<string>();
    }

    public class CreateGuideBlockDto
    {
        public GuideBlockType BlockType { get; set; }
        public int Order { get; set; }
        public string? Content { get; set; }
        public string? MediaUrl { get; set; }
        public string? Caption { get; set; }
        public string? Title { get; set; }
        public string? Metadata { get; set; }
    }
}