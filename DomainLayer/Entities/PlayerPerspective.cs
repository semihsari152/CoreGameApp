namespace DomainLayer.Entities
{
    public class PlayerPerspective
    {
        public int Id { get; set; }
        public int IGDBId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual ICollection<GamePlayerPerspective> GamePlayerPerspectives { get; set; } = new List<GamePlayerPerspective>();
    }
}