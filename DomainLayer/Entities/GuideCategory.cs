namespace DomainLayer.Entities
{
    public class GuideCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconClass { get; set; }
        public int Order { get; set; } = 0;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public virtual ICollection<Guide> Guides { get; set; } = new List<Guide>();
    }
}