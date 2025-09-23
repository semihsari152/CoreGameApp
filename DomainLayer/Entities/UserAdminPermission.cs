using System.ComponentModel.DataAnnotations;

namespace DomainLayer.Entities
{
    /// <summary>
    /// Kullanıcı-Admin Yetki İlişkisi (Many-to-Many)
    /// </summary>
    public class UserAdminPermission
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int AdminPermissionId { get; set; }
        public virtual AdminPermission AdminPermission { get; set; } = null!;

        public int GrantedByUserId { get; set; }
        public virtual User GrantedByUser { get; set; } = null!; // Yetkiyi veren admin

        public DateTime GrantedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public int? RevokedByUserId { get; set; }
        public virtual User? RevokedByUser { get; set; }

        public bool IsActive { get; set; } = true;
        
        [MaxLength(500)]
        public string? Notes { get; set; } // Yetki verme/alma notları
    }
}