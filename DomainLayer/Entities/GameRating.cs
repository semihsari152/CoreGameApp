namespace DomainLayer.Entities
{
    public class GameRating
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int UserId { get; set; }
        public int Rating { get; set; }
        public string? Review { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}