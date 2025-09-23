namespace DomainLayer.Entities
{
    public class GameKeyword
    {
        public int GameId { get; set; }
        public int KeywordId { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
        public virtual Keyword Keyword { get; set; } = null!;
    }
}