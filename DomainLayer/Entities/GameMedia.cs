using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class GameMedia
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public MediaType MediaType { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? IGDBId { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public bool IsPrimary { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
    }
}