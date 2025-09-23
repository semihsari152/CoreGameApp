namespace DomainLayer.Entities
{
    public class ForumTopic
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int UserId { get; set; }
        public int ForumCategoryId { get; set; }
        public int? GameId { get; set; }
        public bool IsSticky { get; set; } = false;
        public bool IsLocked { get; set; } = false;
        public bool IsPublished { get; set; } = true;
        public int ViewCount { get; set; } = 0;
        public int ReplyCount { get; set; } = 0;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual ForumCategory ForumCategory { get; set; } = null!;
        public virtual Game? Game { get; set; }
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
        public virtual ICollection<ForumTopicTag> ForumTopicTags { get; set; } = new List<ForumTopicTag>();
    }
}