namespace DomainLayer.Entities
{
    public class GamePlayerPerspective
    {
        public int GameId { get; set; }
        public int PlayerPerspectiveId { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
        public virtual PlayerPerspective PlayerPerspective { get; set; } = null!;
    }
}