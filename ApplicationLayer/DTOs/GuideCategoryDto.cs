namespace ApplicationLayer.DTOs
{
    public class GuideCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconClass { get; set; }
        public int Order { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}