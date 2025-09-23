namespace DomainLayer.Entities
{
    public class GameMode
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ICollection<GameGameMode> GameGameModes { get; set; } = new List<GameGameMode>();
    }
}