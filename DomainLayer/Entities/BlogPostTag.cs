namespace DomainLayer.Entities
{
    public class BlogPostTag
    {
        public int Id { get; set; }
        public int BlogPostId { get; set; }
        public int TagId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual BlogPost BlogPost { get; set; } = null!;
        public virtual Tag Tag { get; set; } = null!;
    }
}