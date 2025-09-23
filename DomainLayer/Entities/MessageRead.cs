using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DomainLayer.Entities;

public class MessageRead
{
    [Key]
    public int Id { get; set; }

    // Mesaj ID'si
    [Required]
    public int MessageId { get; set; }
    [ForeignKey("MessageId")]
    public virtual Message Message { get; set; } = null!;

    // Mesajı okuyan kullanıcı
    [Required]
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    // Okunma zamanı
    [Required]
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;

    // Oluşturulma tarihi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}