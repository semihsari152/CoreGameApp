namespace DomainLayer.Entities
{
    public class GameGenre
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int GenreId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
        public virtual Genre Genre { get; set; } = null!;
    }
}