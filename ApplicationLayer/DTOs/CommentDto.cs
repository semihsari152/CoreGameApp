using DomainLayer.Enums;

namespace ApplicationLayer.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public CommentableType CommentableType { get; set; }
        public int TargetEntityId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? UserAvatarUrl { get; set; }
        public int? ParentCommentId { get; set; }
        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public bool HasSpoiler { get; set; }
        public bool IsSticky { get; set; }
        public bool IsBestAnswer { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
        public List<CommentDto> ChildComments { get; set; } = new List<CommentDto>();
        
        // Current user interaction flags
        public bool IsLikedByCurrentUser { get; set; } = false;
        public bool IsDislikedByCurrentUser { get; set; } = false;
        
        // Owner likes info
        public bool HasOwnerLike { get; set; } = false;
        public string? OwnerAvatarUrl { get; set; }
    }

    public class CreateCommentDto
    {
        public string Content { get; set; } = string.Empty;
        public CommentableType CommentableType { get; set; }
        public int CommentableEntityId { get; set; }
        public int? ParentCommentId { get; set; }
        public bool HasSpoiler { get; set; } = false;
    }

    public class UpdateCommentDto
    {
        public string Content { get; set; } = string.Empty;
        public bool HasSpoiler { get; set; } = false;
    }
}