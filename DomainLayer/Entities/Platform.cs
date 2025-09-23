namespace DomainLayer.Entities
{
    public class Platform
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
        public string? Abbreviation { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ICollection<GamePlatform> GamePlatforms { get; set; } = new List<GamePlatform>();
    }
}