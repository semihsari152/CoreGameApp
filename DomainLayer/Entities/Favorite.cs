using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class Favorite
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public FavoriteType FavoriteType { get; set; }
        public int TargetEntityId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}