using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DomainLayer.Entities;

public class MessageReaction
{
    [Key]
    public int Id { get; set; }

    // Mesaj ID'si
    [Required]
    public int MessageId { get; set; }
    [ForeignKey("MessageId")]
    public virtual Message Message { get; set; } = null!;

    // Tepki veren kullanıcı
    [Required]
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    // Emoji (Unicode formatında: "😀", "👍", vb.)
    [Required]
    [StringLength(10)]
    public string Emoji { get; set; } = null!;

    // Tepki zamanı
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}