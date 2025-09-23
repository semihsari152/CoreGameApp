namespace ApplicationLayer.DTOs
{
    public class GameRatingDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserDto? User { get; set; }
        public int GameId { get; set; }
        public GameDto? Game { get; set; }
        public int Rating { get; set; }
        public string? Review { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }
    }

    public class CreateGameRatingDto
    {
        public int UserId { get; set; }
        public int GameId { get; set; }
        public int Rating { get; set; }
        public string? Review { get; set; }
    }

    public class UpdateGameRatingDto
    {
        public int? Rating { get; set; }
        public string? Review { get; set; }
    }

    public class GameRatingStatsDto
    {
        public double AverageRating { get; set; }
        public int TotalRatings { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new Dictionary<int, int>();
    }
}