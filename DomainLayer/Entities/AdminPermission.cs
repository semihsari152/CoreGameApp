using System.ComponentModel.DataAnnotations;

namespace DomainLayer.Entities
{
    /// <summary>
    /// Admin panel yetki tanımları
    /// </summary>
    public class AdminPermission
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty; // Benzersiz anahtar (ör: "users.create", "blogs.delete")

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty; // Users, Content, Reports, System vb.

        public bool IsActive { get; set; } = true;
        
        public int Order { get; set; } = 0;
        public DateTime CreatedDate { get; set; }
        public DateTime UpdatedDate { get; set; }

        // Navigation Properties
        public virtual ICollection<UserAdminPermission> UserPermissions { get; set; } = new List<UserAdminPermission>();
    }
}