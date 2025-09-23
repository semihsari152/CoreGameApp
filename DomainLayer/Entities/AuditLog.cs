using System.ComponentModel.DataAnnotations;
using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    /// <summary>
    /// Admin panel işlem kayıtları (Audit Trail)
    /// </summary>
    public class AuditLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty; // "CREATE_USER", "DELETE_POST", "GRANT_PERMISSION" vb.

        [Required]
        [MaxLength(100)]
        public string EntityType { get; set; } = string.Empty; // "User", "BlogPost", "Permission" vb.

        public int? EntityId { get; set; } // İlgili entity'nin ID'si (nullable)

        [MaxLength(100)]
        public string? EntityName { get; set; } // Entity'nin adı (ör: kullanıcı adı, post başlığı)

        public string? OldValues { get; set; } // JSON - Değişiklik öncesi değerler
        public string? NewValues { get; set; } // JSON - Değişiklik sonrası değerler

        [Required]
        [MaxLength(45)]
        public string IpAddress { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? UserAgent { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public AuditLogLevel Level { get; set; } = AuditLogLevel.Info;
        
        public DateTime Timestamp { get; set; }
    }
}