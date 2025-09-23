namespace DomainLayer.Entities
{
    public class GameGameMode
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int GameModeId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
        public virtual GameMode GameMode { get; set; } = null!;
    }
}