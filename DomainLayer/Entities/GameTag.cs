namespace DomainLayer.Entities
{
    public class GameTag
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int TagId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
        public virtual Tag Tag { get; set; } = null!;
    }
}