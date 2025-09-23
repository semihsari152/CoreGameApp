namespace ApplicationLayer.DTOs
{
    public class NotificationStatsDto
    {
        public int TotalNotifications { get; set; }
        public int UnreadNotifications { get; set; }
        public int TodayNotifications { get; set; }
        public int WeekNotifications { get; set; }
        public int ArchivedNotifications { get; set; }
        public Dictionary<string, int> NotificationsByType { get; set; } = new();
        public DateTime LastNotificationDate { get; set; }
    }
}