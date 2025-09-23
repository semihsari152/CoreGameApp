using DomainLayer.Enums;

namespace ApplicationLayer.DTOs.Guide
{
    public class GuideBlockDto
    {
        public int Id { get; set; }
        public int GuideId { get; set; }
        public GuideBlockType BlockType { get; set; }
        public int Order { get; set; }
        public string? Content { get; set; }
        public string? MediaUrl { get; set; }
        public string? Caption { get; set; }
        public string? Title { get; set; }
        public string? Metadata { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
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

    public class UpdateGuideBlockDto
    {
        public int? Id { get; set; } // Mevcut block ID'si - yeni bloklar için null
        public GuideBlockType BlockType { get; set; }
        public int Order { get; set; }
        public string? Content { get; set; }
        public string? MediaUrl { get; set; }
        public string? Caption { get; set; }
        public string? Title { get; set; }
        public string? Metadata { get; set; }
    }
}