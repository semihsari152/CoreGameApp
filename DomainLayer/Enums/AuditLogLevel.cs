namespace DomainLayer.Enums
{
    /// <summary>
    /// Audit log seviyeleri
    /// </summary>
    public enum AuditLogLevel
    {
        Info = 0,      // Bilgi seviyesi (normal işlemler)
        Warning = 1,   // Uyarı seviyesi (şüpheli işlemler)
        Critical = 2,  // Kritik seviye (önemli değişiklikler)
        Security = 3   // Güvenlik seviyesi (yetki değişiklikleri, login denemeleri)
    }
}