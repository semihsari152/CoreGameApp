using System.ComponentModel.DataAnnotations;
using DomainLayer.Enums;

namespace DomainLayer.Entities;

public class Conversation
{
    [Key]
    public int Id { get; set; }

    // Konuşma türü (Direct Message, Group Chat)
    [Required]
    public ConversationType Type { get; set; }

    // Konuşma başlığı (grup sohbetleri için)
    [StringLength(100)]
    public string? Title { get; set; }

    // Konuşma açıklaması (grup sohbetleri için)
    [StringLength(500)]
    public string? Description { get; set; }

    // Grup fotosu URL'i (grup sohbetleri için)
    [StringLength(500)]
    public string? GroupImageUrl { get; set; }

    // Son mesaj
    public virtual Message? LastMessage { get; set; }
    public int? LastMessageId { get; set; }

    // Son mesaj zamanı
    public DateTime? LastMessageAt { get; set; }

    // Konuşma aktif mi
    public bool IsActive { get; set; } = true;

    // Oluşturan kullanıcı
    [Required]
    public int CreatedById { get; set; }
    public virtual User CreatedBy { get; set; } = null!;

    // Konuşma katılımcıları
    public virtual ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();

    // Konuşmadaki mesajlar
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    // Oluşturulma tarihi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Güncellenme tarihi
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}