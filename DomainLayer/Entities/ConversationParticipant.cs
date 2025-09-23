using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DomainLayer.Enums;

namespace DomainLayer.Entities;

public class ConversationParticipant
{
    [Key]
    public int Id { get; set; }

    // Konuşma ID'si
    [Required]
    public int ConversationId { get; set; }
    [ForeignKey("ConversationId")]
    public virtual Conversation Conversation { get; set; } = null!;

    // Katılımcı kullanıcı
    [Required]
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    // Katılımcının rolü (Admin, Member)
    [Required]
    public ParticipantRole Role { get; set; } = ParticipantRole.Member;

    // Katılım tarihi
    [Required]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Ayrılma tarihi (null ise hala katılımcı)
    public DateTime? LeftAt { get; set; }

    // Aktif katılımcı mı
    public bool IsActive { get; set; } = true;

    // Son okunma zamanı (bu kullanıcı için)
    public DateTime? LastReadAt { get; set; }

    // Son görülen mesaj ID'si
    public int? LastReadMessageId { get; set; }

    // Bildirimler açık mı
    public bool NotificationsEnabled { get; set; } = true;

    // Konuşmayı sessize aldı mı
    public bool IsMuted { get; set; } = false;

    // Sessize alma bitiş tarihi
    public DateTime? MutedUntil { get; set; }

    // Oluşturulma tarihi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Güncellenme tarihi
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}