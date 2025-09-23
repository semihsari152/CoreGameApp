using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DomainLayer.Entities;

public class Follow
{
    [Key]
    public int Id { get; set; }

    // Takip eden kullanıcı
    [Required]
    public int FollowerId { get; set; }
    [ForeignKey("FollowerId")]
    public virtual User Follower { get; set; } = null!;

    // Takip edilen kullanıcı
    [Required]
    public int FollowingId { get; set; }
    [ForeignKey("FollowingId")]
    public virtual User Following { get; set; } = null!;

    // Takip başlangıç tarihi
    [Required]
    public DateTime FollowedAt { get; set; } = DateTime.UtcNow;

    // Aktif mi (takip devam ediyor mu)
    public bool IsActive { get; set; } = true;

    // Takibi bırakan tarihi
    public DateTime? UnfollowedAt { get; set; }

    // Bildirimler açık mı (takip edilen kişinin yeni içeriklerinden haberdar olmak)
    public bool NotificationsEnabled { get; set; } = true;

    // Oluşturulma tarihi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Güncellenme tarihi
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}