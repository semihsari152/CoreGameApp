import { Platform, UserRole, CommentableType, NotificationType, ReportType, ReportStatus } from '../types';

export const PLATFORM_LABELS: Record<Platform, string> = {
  [Platform.PC]: 'PC',
  [Platform.PlayStation]: 'PlayStation',
  [Platform.Xbox]: 'Xbox',
  [Platform.Nintendo]: 'Nintendo',
  [Platform.Mobile]: 'Mobile',
  [Platform.Mac]: 'Mac',
  [Platform.Linux]: 'Linux',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.User]: 'Kullanıcı',
  [UserRole.Moderator]: 'Moderatör',
  [UserRole.Admin]: 'Admin',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.User]: 'badge-primary',
  [UserRole.Moderator]: 'badge-warning',
  [UserRole.Admin]: 'badge-error',
};

export const COMMENTABLE_TYPE_LABELS: Record<CommentableType, string> = {
  [CommentableType.Game]: 'Oyun',
  [CommentableType.Guide]: 'Kılavuz',
  [CommentableType.BlogPost]: 'Blog Yazısı',
  [CommentableType.ForumTopic]: 'Forum Konusu',
  [CommentableType.User]: 'Kullanıcı Profili',
};

export const NOTIFICATION_TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  // Likes & Reactions
  [NotificationType.LikeOnComment]: 'Yorum Beğenisi',
  [NotificationType.LikeOnForumTopic]: 'Forum Konusu Beğenisi',
  [NotificationType.LikeOnBlogPost]: 'Blog Yazısı Beğenisi',
  [NotificationType.LikeOnGuide]: 'Kılavuz Beğenisi',
  [NotificationType.DislikeOnComment]: 'Yorum Beğenmemesi',
  
  // Comments & Replies
  [NotificationType.CommentOnForumTopic]: 'Forum Konusu Yorumu',
  [NotificationType.CommentOnBlogPost]: 'Blog Yazısı Yorumu',
  [NotificationType.CommentOnGuide]: 'Kılavuz Yorumu',
  [NotificationType.ReplyToComment]: 'Yoruma Cevap',
  [NotificationType.BestAnswerSelected]: 'En İyi Cevap Seçildi',
  
  // Social Activities
  [NotificationType.UserFollowed]: 'Kullanıcı Takibi',
  [NotificationType.UserMentioned]: 'Kullanıcı Etiketlemesi',
  [NotificationType.UserTagged]: 'Kullanıcı Tagı',
  
  // Favorites
  [NotificationType.ContentAddedToFavorites]: 'Favorilere Eklendi',
  
  // Game Activities
  [NotificationType.GameStatusChanged]: 'Oyun Durumu Değişti',
  [NotificationType.GameRatingAdded]: 'Oyun Puanı Eklendi',
  [NotificationType.GameReviewAdded]: 'Oyun İncelemesi Eklendi',
  
  // System & Admin
  [NotificationType.SystemNotification]: 'Sistem Bildirimi',
  [NotificationType.AdminMessage]: 'Admin Mesajı',
  [NotificationType.MaintenanceNotice]: 'Bakım Bildirimi',
  
  // Special Events
  [NotificationType.AchievementUnlocked]: 'Başarım Kazanıldı',
  [NotificationType.LevelUp]: 'Seviye Atladı',
  [NotificationType.SpecialEvent]: 'Özel Etkinlik',
};

export const NOTIFICATION_TYPE_COLORS: Partial<Record<NotificationType, string>> = {
  // Likes & Reactions
  [NotificationType.LikeOnComment]: 'badge-error',
  [NotificationType.LikeOnForumTopic]: 'badge-error',
  [NotificationType.LikeOnBlogPost]: 'badge-error',
  [NotificationType.LikeOnGuide]: 'badge-error',
  [NotificationType.DislikeOnComment]: 'badge-warning',
  
  // Comments & Replies
  [NotificationType.CommentOnForumTopic]: 'badge-primary',
  [NotificationType.CommentOnBlogPost]: 'badge-primary',
  [NotificationType.CommentOnGuide]: 'badge-success',
  [NotificationType.ReplyToComment]: 'badge-primary',
  [NotificationType.BestAnswerSelected]: 'badge-warning',
  
  // Social Activities
  [NotificationType.UserFollowed]: 'badge-gaming',
  [NotificationType.UserMentioned]: 'badge-gaming',
  [NotificationType.UserTagged]: 'badge-gaming',
  
  // Favorites
  [NotificationType.ContentAddedToFavorites]: 'badge-error',
  
  // Game Activities
  [NotificationType.GameStatusChanged]: 'badge-gaming',
  [NotificationType.GameRatingAdded]: 'badge-gaming',
  [NotificationType.GameReviewAdded]: 'badge-gaming',
  
  // System & Admin
  [NotificationType.SystemNotification]: 'badge-primary',
  [NotificationType.AdminMessage]: 'badge-error',
  [NotificationType.MaintenanceNotice]: 'badge-warning',
  
  // Special Events
  [NotificationType.AchievementUnlocked]: 'badge-warning',
  [NotificationType.LevelUp]: 'badge-success',
  [NotificationType.SpecialEvent]: 'badge-gaming',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.Spam]: 'Spam',
  [ReportType.Harassment]: 'Taciz',
  [ReportType.InappropriateContent]: 'Uygunsuz İçerik',
  [ReportType.CopyrightViolation]: 'Telif Hakkı İhlali',
  [ReportType.Misinformation]: 'Yanlış Bilgi',
  [ReportType.FakeProfile]: 'Sahte Profil',
  [ReportType.OffensiveLanguage]: 'Saldırgan Dil',
  [ReportType.Other]: 'Diğer',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: 'Bekliyor',
  [ReportStatus.UnderReview]: 'İnceleniyor',
  [ReportStatus.Approved]: 'Onaylandı',
  [ReportStatus.Rejected]: 'Reddedildi',
  [ReportStatus.Resolved]: 'Çözüldü',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: 'badge-warning',
  [ReportStatus.UnderReview]: 'badge-primary',
  [ReportStatus.Approved]: 'badge-success',
  [ReportStatus.Rejected]: 'badge-error',
  [ReportStatus.Resolved]: 'badge-success',
};

// Rating Constants
export const RATING_STARS = [1, 2, 3, 4, 5];
export const RATING_LABELS: Record<number, string> = {
  1: 'Çok Kötü',
  2: 'Kötü',
  3: 'Orta',
  4: 'İyi',
  5: 'Mükemmel',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'coregame_theme',
  LANGUAGE: 'coregame_language',
  FILTERS: 'coregame_filters',
  PREFERENCES: 'coregame_preferences',
};

// Theme
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// API Endpoints for external resources
export const EXTERNAL_APIS = {
  IGDB_IMAGE_BASE: 'https://images.igdb.com/igdb/image/upload/t_cover_big/',
  STEAM_IMAGE_BASE: 'https://cdn.akamai.steamstatic.com/steam/apps/',
  PLACEHOLDER_IMAGE: 'https://via.placeholder.com/300x400/374151/ffffff?text=No+Image',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmuyor.',
  NOT_FOUND: 'Aranan içerik bulunamadı.',
  SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
  VALIDATION_ERROR: 'Girilen bilgiler geçersiz.',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Başarıyla giriş yapıldı!',
  REGISTER_SUCCESS: 'Hesap başarıyla oluşturuldu!',
  LOGOUT_SUCCESS: 'Başarıyla çıkış yapıldı',
  PROFILE_UPDATED: 'Profil başarıyla güncellendi',
  PASSWORD_CHANGED: 'Şifre başarıyla değiştirildi',
  COMMENT_ADDED: 'Yorum başarıyla eklendi',
  COMMENT_UPDATED: 'Yorum başarıyla güncellendi',
  COMMENT_DELETED: 'Yorum başarıyla silindi',
  GUIDE_CREATED: 'Kılavuz başarıyla oluşturuldu',
  GUIDE_UPDATED: 'Kılavuz başarıyla güncellendi',
  GUIDE_DELETED: 'Kılavuz başarıyla silindi',
  TOPIC_CREATED: 'Konu başarıyla oluşturuldu',
  TOPIC_UPDATED: 'Konu başarıyla güncellendi',
  TOPIC_DELETED: 'Konu başarıyla silindi',
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
  COMMENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000,
  },
  GUIDE_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  GUIDE_CONTENT: {
    MIN_LENGTH: 50,
    MAX_LENGTH: 10000,
  },
  FORUM_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  FORUM_CONTENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000,
  },
};

// Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  LOADING: 1000,
};

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};