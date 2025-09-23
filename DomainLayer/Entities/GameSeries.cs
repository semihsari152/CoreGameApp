namespace DomainLayer.Entities
{
    public class GameSeries
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ICollection<Game> Games { get; set; } = new List<Game>();
    }
}