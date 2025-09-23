using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DomainLayer.Enums;

namespace DomainLayer.Entities;

public class Message
{
    [Key]
    public int Id { get; set; }

    // Konuşma ID'si
    [Required]
    public int ConversationId { get; set; }
    [ForeignKey("ConversationId")]
    public virtual Conversation Conversation { get; set; } = null!;

    // Mesajı gönderen kullanıcı
    [Required]
    public int SenderId { get; set; }
    [ForeignKey("SenderId")]
    public virtual User Sender { get; set; } = null!;

    // Mesaj içeriği (text)
    [StringLength(2000)]
    public string? Content { get; set; }

    // Mesaj türü
    [Required]
    public MessageType Type { get; set; } = MessageType.Text;

    // Medya URL'i (fotoğraf, GIF vb.)
    [StringLength(500)]
    public string? MediaUrl { get; set; }

    // Medya türü (image/gif/video vb.)
    [StringLength(50)]
    public string? MediaType { get; set; }

    // Medya boyutları (JSON format: {"width": 800, "height": 600})
    [StringLength(100)]
    public string? MediaDimensions { get; set; }

    // Yanıt verilen mesaj (reply)
    public int? ReplyToMessageId { get; set; }
    [ForeignKey("ReplyToMessageId")]
    public virtual Message? ReplyToMessage { get; set; }

    // Bu mesaja verilen yanıtlar
    public virtual ICollection<Message> Replies { get; set; } = new List<Message>();

    // Mesaj durumu
    [Required]
    public MessageStatus Status { get; set; } = MessageStatus.Sent;

    // Mesaj silinmiş mi
    public bool IsDeleted { get; set; } = false;

    // Mesaj düzenlenmiş mi
    public bool IsEdited { get; set; } = false;

    // Son düzenleme zamanı
    public DateTime? EditedAt { get; set; }

    // Silinme zamanı
    public DateTime? DeletedAt { get; set; }

    // Mesaj okunma durumları
    public virtual ICollection<MessageRead> MessageReads { get; set; } = new List<MessageRead>();

    // Mesaj tepkileri (emoji reactions)
    public virtual ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();

    // Oluşturulma tarihi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Güncellenme tarihi
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}