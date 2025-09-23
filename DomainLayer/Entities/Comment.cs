using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public CommentableType CommentableType { get; set; }
        public int TargetEntityId { get; set; }
        public int UserId { get; set; }
        public int? ParentCommentId { get; set; }
        public int LikesCount { get; set; } = 0;
        public int DislikesCount { get; set; } = 0;
        public bool HasSpoiler { get; set; } = false;
        public bool IsSticky { get; set; } = false;
        public bool IsBestAnswer { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public virtual User User { get; set; } = null!;
        public virtual Comment? ParentComment { get; set; }
        public virtual ICollection<Comment> ChildComments { get; set; } = new List<Comment>();
        public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
    }
}