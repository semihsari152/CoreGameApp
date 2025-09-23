using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class LikeDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserDto? User { get; set; }
        public LikableType LikableType { get; set; }
        public int TargetEntityId { get; set; }
        public bool IsLike { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CreateLikeDto
    {
        public int UserId { get; set; }
        public LikableType LikableType { get; set; }
        public int TargetEntityId { get; set; }
        public bool IsLike { get; set; }
    }

    public class LikeStatsDto
    {
        public int LikeCount { get; set; }
        public int DislikeCount { get; set; }
        public int TotalCount { get; set; }
        public double LikePercentage { get; set; }
    }

    public class ToggleLikeDto
    {
        public int UserId { get; set; }
        public LikableType Type { get; set; }
        public int EntityId { get; set; }
        public bool IsLike { get; set; }
    }
}