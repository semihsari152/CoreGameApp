namespace DomainLayer.Entities
{
    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ICollection<GameTag> GameTags { get; set; } = new List<GameTag>();
        public virtual ICollection<ForumTopicTag> ForumTopicTags { get; set; } = new List<ForumTopicTag>();
        public virtual ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
        public virtual ICollection<GuideTag> GuideTags { get; set; } = new List<GuideTag>();
    }
}