namespace DomainLayer.Entities
{
    public class GamePriceInfo
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        
        public decimal? Price { get; set; }
        public DateTime? LastPriceUpdate { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
    }
}