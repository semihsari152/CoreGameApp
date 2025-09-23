namespace DomainLayer.Entities
{
    public class ForumTopicTag
    {
        public int Id { get; set; }
        public int ForumTopicId { get; set; }
        public int TagId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ForumTopic ForumTopic { get; set; } = null!;
        public virtual Tag Tag { get; set; } = null!;
    }
}