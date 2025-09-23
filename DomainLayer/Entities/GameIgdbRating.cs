namespace DomainLayer.Entities
{
    public class GameIgdbRating
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        
        // IGDB User Rating (community rating from IGDB)
        public decimal? UserRating { get; set; }
        public int? UserRatingCount { get; set; }
        
        // IGDB Critic Rating (professional critic scores from IGDB)
        public decimal? CriticRating { get; set; }
        public int? CriticRatingCount { get; set; }
        
        // IGDB Data Source Info
        public DateTime? LastUpdated { get; set; }
        public DateTime? IgdbLastSync { get; set; }
        
        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
        
        // Helper Properties (convert IGDB 0-100 scale to 0-10 scale for display)
        public decimal? UserRatingDisplay => UserRating.HasValue ? Math.Round(UserRating.Value / 10.0m, 1) : null;
        public decimal? CriticRatingDisplay => CriticRating.HasValue ? Math.Round(CriticRating.Value / 10.0m, 1) : null;
    }
}