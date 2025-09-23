namespace DomainLayer.Entities
{
    public class Keyword
    {
        public int Id { get; set; }
        public int IGDBId { get; set; }
        public string Name { get; set; } = string.Empty;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual ICollection<GameKeyword> GameKeywords { get; set; } = new List<GameKeyword>();
    }
}