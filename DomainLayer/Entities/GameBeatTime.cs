namespace DomainLayer.Entities
{
    public class GameBeatTime
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        
        // Main Story
        public int? MainAvgSeconds { get; set; }
        public int? MainPolledCount { get; set; }
        
        // Main + Extras
        public int? ExtraAvgSeconds { get; set; }
        public int? ExtraPolledCount { get; set; }
        
        // Completionist
        public int? CompletionistAvgSeconds { get; set; }
        public int? CompletionistPolledCount { get; set; }
        
        // All Styles
        public int? AllAvgSeconds { get; set; }
        public int? AllPolledCount { get; set; }
        
        // HowLongToBeat Data Source Info
        public string? HltbGameName { get; set; }
        public int? HltbGameId { get; set; }
        public DateTime? LastUpdated { get; set; }
        
        // Navigation Properties
        public virtual Game Game { get; set; } = null!;
        
        // Helper Properties (convert seconds to hours for easy display)
        public double? MainHours => MainAvgSeconds.HasValue ? Math.Round(MainAvgSeconds.Value / 3600.0, 1) : null;
        public double? ExtraHours => ExtraAvgSeconds.HasValue ? Math.Round(ExtraAvgSeconds.Value / 3600.0, 1) : null;
        public double? CompletionistHours => CompletionistAvgSeconds.HasValue ? Math.Round(CompletionistAvgSeconds.Value / 3600.0, 1) : null;
        public double? AllHours => AllAvgSeconds.HasValue ? Math.Round(AllAvgSeconds.Value / 3600.0, 1) : null;
    }
}