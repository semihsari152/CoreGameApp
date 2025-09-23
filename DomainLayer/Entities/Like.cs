using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class Like
    {
        public int Id { get; set; }
        public LikableType LikableType { get; set; }
        public int TargetEntityId { get; set; }
        public int UserId { get; set; }
        public bool IsLike { get; set; } = true;
        public bool IsOwnerLike { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
    }
}