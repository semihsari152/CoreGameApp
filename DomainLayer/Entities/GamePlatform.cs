namespace DomainLayer.Entities
{
    public class GamePlatform
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int PlatformId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
        public virtual Platform Platform { get; set; } = null!;
    }
}