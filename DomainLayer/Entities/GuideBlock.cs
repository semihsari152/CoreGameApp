using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class GuideBlock
    {
        public int Id { get; set; }
        public int GuideId { get; set; }
        public GuideBlockType BlockType { get; set; }
        public int Order { get; set; }
        
        // Content fields - JSON stored for flexibility
        public string? Content { get; set; }        // Main content (text, markdown, HTML)
        public string? MediaUrl { get; set; }       // Image/Video URL
        public string? Caption { get; set; }        // Caption for media
        public string? Title { get; set; }          // Block title (for sections, quotes)
        public string? Metadata { get; set; }       // JSON for additional properties (styling, dimensions, etc.)
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation
        public virtual Guide Guide { get; set; } = null!;
    }
}