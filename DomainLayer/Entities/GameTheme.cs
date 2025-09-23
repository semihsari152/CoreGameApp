namespace DomainLayer.Entities
{
    public class GameTheme
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int ThemeId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Game Game { get; set; } = null!;
        public virtual Theme Theme { get; set; } = null!;
    }
}