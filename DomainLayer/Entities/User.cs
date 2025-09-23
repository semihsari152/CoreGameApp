using DomainLayer.Enums;

namespace DomainLayer.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public UserRole Role { get; set; } = UserRole.User;
        public int Status { get; set; } = 0; // 0=Active, 1=Inactive, 2=Banned
        public int Level { get; set; } = 1;
        public int XP { get; set; } = 0;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime LastLoginDate { get; set; } = DateTime.UtcNow;
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
        public bool IsOnline { get; set; } = false;
        public bool IsEmailVerified { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public bool IsNewUser { get; set; } = false; // New OAuth users require profile setup
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }
        
        // Privacy Settings
        public bool IsProfileVisible { get; set; } = true;
        public bool IsActivityStatusVisible { get; set; } = true;
        public bool IsGameListVisible { get; set; } = true;

        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
        public virtual ICollection<UserGameStatus> UserGameStatuses { get; set; } = new List<UserGameStatus>();
        public virtual ICollection<Guide> Guides { get; set; } = new List<Guide>();
        public virtual ICollection<ForumTopic> ForumTopics { get; set; } = new List<ForumTopic>();
        public virtual ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<Notification> TriggeredNotifications { get; set; } = new List<Notification>();
        public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
        public virtual ICollection<Report> ReviewedReports { get; set; } = new List<Report>();
        public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();

        // Friendship relationships
        public virtual ICollection<Friendship> SentFriendRequests { get; set; } = new List<Friendship>();
        public virtual ICollection<Friendship> ReceivedFriendRequests { get; set; } = new List<Friendship>();

        // Follow relationships
        public virtual ICollection<Follow> Following { get; set; } = new List<Follow>();
        public virtual ICollection<Follow> Followers { get; set; } = new List<Follow>();

        // Messaging relationships
        public virtual ICollection<ConversationParticipant> ConversationParticipants { get; set; } = new List<ConversationParticipant>();
        public virtual ICollection<Conversation> CreatedConversations { get; set; } = new List<Conversation>();

        // Admin Panel relationships
        public virtual ICollection<UserAdminPermission> AdminPermissions { get; set; } = new List<UserAdminPermission>();
        public virtual ICollection<UserAdminPermission> GrantedPermissions { get; set; } = new List<UserAdminPermission>();
        public virtual ICollection<UserAdminPermission> RevokedPermissions { get; set; } = new List<UserAdminPermission>();
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
        public virtual ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public virtual ICollection<MessageRead> MessageReads { get; set; } = new List<MessageRead>();
        public virtual ICollection<MessageReaction> MessageReactions { get; set; } = new List<MessageReaction>();
    }
}