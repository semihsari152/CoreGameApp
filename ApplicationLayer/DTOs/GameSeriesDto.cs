namespace ApplicationLayer.DTOs
{
    public class GameSeriesDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
        public DateTime CreatedDate { get; set; }
        public int GameCount { get; set; }
    }

    public class CreateGameSeriesDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
    }

    public class UpdateGameSeriesDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? IGDBId { get; set; }
        public string? IGDBName { get; set; }
    }
}