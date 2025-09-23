namespace DomainLayer.Enums
{
    public enum NotificationPriority
    {
        Low = 1,      // Beğeniler, favoriler vb.
        Normal = 2,   // Yorumlar, cevaplar
        High = 3,     // Moderasyon, önemli aktiviteler
        Critical = 4  // Sistem mesajları, ban/uyarılar
    }
}