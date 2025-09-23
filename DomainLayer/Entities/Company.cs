namespace DomainLayer.Entities
{
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? IGDBId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public virtual ICollection<GameCompany> GameCompanies { get; set; } = new List<GameCompany>();
    }
}