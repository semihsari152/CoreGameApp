using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class GameWebsite
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public WebsiteType WebsiteType { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? Name { get; set; }
        public int? IGDBId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
    }
}