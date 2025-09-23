using Newtonsoft.Json;

namespace DomainLayer.ExternalApiModels
{
    public class HltbGameData
    {
        [JsonProperty("gameName")]
        public string GameName { get; set; } = string.Empty;

        [JsonProperty("type")]
        public string Type { get; set; } = string.Empty;

        [JsonProperty("gameId")]
        public int GameId { get; set; }

        [JsonProperty("gameImage")]
        public string GameImage { get; set; } = string.Empty;

        [JsonProperty("releaseYear")]
        public int ReleaseYear { get; set; }

        [JsonProperty("beatTime")]
        public BeatTimeData? BeatTime { get; set; }

        // Helper properties to convert seconds to hours
        public double? MainStoryHours => BeatTime?.Main?.AvgSeconds > 0 ? Math.Round(BeatTime.Main.AvgSeconds / 3600.0, 1) : null;
        public double? CompletionistHours => BeatTime?.Completionist?.AvgSeconds > 0 ? Math.Round(BeatTime.Completionist.AvgSeconds / 3600.0, 1) : null;
        public double? MainPlusExtrasHours => BeatTime?.Extra?.AvgSeconds > 0 ? Math.Round(BeatTime.Extra.AvgSeconds / 3600.0, 1) : null;
    }

    public class BeatTimeData
    {
        [JsonProperty("main")]
        public TimeData? Main { get; set; }

        [JsonProperty("extra")]
        public TimeData? Extra { get; set; }

        [JsonProperty("completionist")]
        public TimeData? Completionist { get; set; }

        [JsonProperty("all")]
        public TimeData? All { get; set; }
    }

    public class TimeData
    {
        [JsonProperty("avgSeconds")]
        public int AvgSeconds { get; set; }

        [JsonProperty("polledCount")]
        public int PolledCount { get; set; }
    }
}