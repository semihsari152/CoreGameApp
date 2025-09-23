using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DomainLayer.Enums;

namespace DomainLayer.Entities;

public class Friendship
{
    [Key]
    public int Id { get; set; }

    // Arkadaşlık isteğini gönderen kullanıcı
    [Required]
    public int SenderId { get; set; }
    [ForeignKey("SenderId")]
    public virtual User Sender { get; set; } = null!;

    // Arkadaşlık isteğini alan kullanıcı
    [Required]
    public int ReceiverId { get; set; }
    [ForeignKey("ReceiverId")]
    public virtual User Receiver { get; set; } = null!;

    // Arkadaşlık durumu
    [Required]
    public FriendshipStatus Status { get; set; }

    // İstek tarihi
    [Required]
    public DateTime RequestedAt { get; set; }

    // Kabul/Red tarihi
    public DateTime? RespondedAt { get; set; }

    // Arkadaşlık başlangıç tarihi (kabul edildiyse)
    public DateTime? FriendsSince { get; set; }

    // Bloklamı işareti
    public bool IsBlocked { get; set; } = false;

    // Bloklayanın kim olduğu (SenderId veya ReceiverId)
    public int? BlockedById { get; set; }

    // Bloklanma tarihi
    public DateTime? BlockedAt { get; set; }

    // Oluşturulma tarihi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Güncellenme tarihi
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}