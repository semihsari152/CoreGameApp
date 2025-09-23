namespace DomainLayer.Entities
{
    public class ForumCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Order { get; set; } = 0;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ICollection<ForumTopic> ForumTopics { get; set; } = new List<ForumTopic>();
    }
}