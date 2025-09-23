namespace DomainLayer.Entities
{
    public class GameCompany
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int CompanyId { get; set; }
        public bool IsDeveloper { get; set; }
        public bool IsPublisher { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
        public virtual Company Company { get; set; } = null!;
    }
}