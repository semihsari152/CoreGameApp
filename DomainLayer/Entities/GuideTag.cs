namespace DomainLayer.Entities
{
    public class GuideTag
    {
        public int Id { get; set; }
        public int GuideId { get; set; }
        public int TagId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual Guide Guide { get; set; } = null!;
        public virtual Tag Tag { get; set; } = null!;
    }
}