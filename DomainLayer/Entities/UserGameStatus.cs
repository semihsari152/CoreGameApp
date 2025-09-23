using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class UserGameStatus
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int GameId { get; set; }
        public GameListType Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual Game Game { get; set; } = null!;
    }
}