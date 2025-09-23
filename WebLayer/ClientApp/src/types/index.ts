// User Types - Updated interface

export enum UserRole {
  User = 1,
  Moderator = 2,
  Admin = 3
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  bio?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// Game Types
export interface Game {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  summary?: string;
  storyline?: string;
  releaseDate: string;
  publisher?: string;
  developer?: string;
  isEarlyAccess: boolean;
  metacriticScore?: number;
  igdbId?: number;
  igdbSlug?: string;
  igdbUrl?: string;
  coverImageId?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  bannerImageUrl?: string;
  officialWebsite?: string;
  gameSeries?: {
    id: number;
    name: string;
    description?: string;
  };
  platforms?: Array<{ id: number; name: string }>;
  genres?: Array<{ id: number; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  gameModes?: Array<{ id: number; name: string }>;
  playerPerspectives?: Array<{ id: number; name: string }>;
  keywords?: Array<{ id: number; name: string }>;
  companies?: Array<{ id: number; name: string; role: string }>;
  websites?: Array<{ id: number; url: string; category: string; name?: string }>;
  screenshots?: string[];
  videos?: string[];
  gameMedia?: Array<{
    id: number;
    mediaType: number; // 1=Image, 2=Video, 3=Screenshot, 4=Cover, 5=Artwork, 6=Logo
    url: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    width?: number;
    height?: number;
    isPrimary: boolean;
  }>;
  guides?: Array<{
    id: number;
    title: string;
    slug?: string;
    summary?: string;
    description?: string;
    content?: string;
    difficulty?: string;
    guideCategory?: {
      id: number;
      name: string;
      iconClass?: string;
    };
    user?: {
      id: number;
      username: string;
    };
    author?: {
      id: number;
      username: string;
    };
    createdAt?: string;
    createdDate?: string;
    viewCount?: number;
  }>;
  blogPosts?: Array<{
    id: number;
    title: string;
    slug?: string;
    summary?: string;
    content?: string;
    category?: {
      id: number;
      name: string;
      color?: string;
    };
    author?: {
      id: number;
      username: string;
    };
    createdAt?: string;
    createdDate?: string;
    viewCount?: number;
  }>;
  forumPosts?: Array<{
    id: number;
    title: string;
    slug?: string;
    content?: string;
    category?: {
      id: number;
      name: string;
    };
    forumCategory?: {
      id: number;
      name: string;
    };
    user?: {
      id: number;
      username: string;
    };
    createdDate?: string;
    viewCount?: number;
    repliesCount?: number;
  }>;
  beatTimes?: {
    mainStory?: number;
    mainPlusExtras?: number;
    completionist?: number;
    allStyles?: number;
  };
  igdbRating?: {
    userRating?: number;
    userRatingCount?: number;
    criticRating?: number;
    criticRatingCount?: number;
  };
  reviews?: Array<{
    id: number;
    rating: number;
    review?: string;
    createdDate: string;
    user: {
      id: number;
      username: string;
      avatarUrl?: string;
    };
  }>;
  totalReviews?: number;
  averageRating?: number;
  ratingDistribution?: { [key: number]: number };
  tags?: Tag[];
  rating?: number;
  ratingsCount?: number;
  favoriteCount?: number;
  guideCount?: number;
  viewCount?: number;
}

export enum Platform {
  PC = 1,
  PlayStation = 2,
  Xbox = 3,
  Nintendo = 4,
  Mobile = 5,
  Mac = 6,
  Linux = 7
}

export interface Genre {
  id: number;
  name: string;
  description?: string;
  createdDate: string;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  createdDate: string;
}

// Comment Types
export interface Comment {
  id: number;
  content: string;
  userId?: number;
  username?: string;
  userAvatarUrl?: string;
  author?: User;
  user?: User;
  commentableType?: CommentableType;
  commentableEntityId?: number;
  parentCommentId?: number;
  parentComment?: Comment;
  childComments?: Comment[];
  likeCount?: number;
  dislikeCount?: number;
  isLikedByCurrentUser?: boolean;
  isDislikedByCurrentUser?: boolean;
  hasSpoiler?: boolean;
  isSticky?: boolean;
  isBestAnswer?: boolean;
  hasOwnerLike?: boolean;
  ownerAvatarUrl?: string;
  createdAt: string;
  createdDate?: string;
  updatedDate?: string;
}

export enum CommentableType {
  Game = 1,
  Guide = 2,
  BlogPost = 3,
  ForumTopic = 4,
  User = 5
}

export enum LikableType {
  Comment = 1,
  Guide = 2,
  BlogPost = 3,
  ForumTopic = 4,
  Game = 5,
  User = 6
}

// Like Types
export interface Like {
  id: number;
  userId: number;
  user?: User;
  likableType: LikableType;
  targetEntityId: number;
  isLike: boolean;
  createdDate: string;
}

export interface CreateLikeDto {
  userId: number;
  likableType: LikableType;
  targetEntityId: number;
  isLike: boolean;
}

export interface LikeStats {
  likeCount: number;
  dislikeCount: number;
  totalCount: number;
  likePercentage: number;
}

// User Game Status Types
export enum GameListType {
  Oynadim = 1,      // ✅ Oynadım  
  Oynamadim = 2,    // ❌ Oynamadım  
  Oynuyorum = 3,    // 🎮 Oynuyorum  
  Oynayacagim = 4,  // ⏳ Oynayacağım  
  Oynamam = 5,      // 🚫 Oynamam  
  Biraktim = 6      // 📴 Bıraktım
}

export interface UserGameStatus {
  id: number;
  userId: number;
  gameId: number;
  status: GameListType;
  notes?: string;
  createdDate: string;
  updatedDate: string;
  user?: User;
  game?: Game;
}

export interface CreateUserGameStatusDto {
  gameId: number;
  status: GameListType;
  notes?: string;
}

export interface UpdateUserGameStatusDto {
  status: GameListType;
  notes?: string;
}

// Favorite Types
export enum FavoriteType {
  Game = 1,
  BlogPost = 2,
  Guide = 3,
  ForumTopic = 4,
  User = 5
}

export interface Favorite {
  id: number;
  userId: number;
  favoriteType: FavoriteType;
  targetEntityId: number;
  createdDate: string;
  user?: User;
}

export interface CreateFavoriteDto {
  favoriteType: FavoriteType;
  targetEntityId: number;
}

// Forum Types
export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
  topicCount?: number;
  order?: number;
  createdDate?: string;
}

export interface ForumTopic {
  id: number;  
  title: string;
  slug?: string;
  content: string;
  userId?: number;
  author?: User;
  user?: User;
  forumCategoryId?: number;
  category?: ForumCategory;
  forumCategory?: ForumCategory;
  gameId?: number;
  game?: Game;
  tags?: string[];
  isPinned?: boolean;
  isSticky?: boolean;
  isLocked?: boolean;
  viewCount?: number;
  replyCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  createdAt?: string;
  createdDate?: string;
  updatedDate?: string;
}

// Guide Types
export interface Guide {
  id: number;
  title: string;
  slug?: string;
  content: string;
  description?: string;
  summary?: string;
  thumbnailUrl?: string;
  userId?: number;
  author?: User;
  user?: User;
  gameId?: number;
  game?: Game;
  guideCategory?: {
    id: number;
    name: string;
    iconClass?: string;
  };
  isPublished?: boolean;
  rating?: number;
  viewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  difficulty?: string;
  estimatedTimeMinutes?: number;
  guideBlocks?: any[];
  createdAt: string;
  createdDate?: string;
  updatedDate?: string;
}

// Notification Types - Updated to match backend implementation

export enum NotificationType {
  // Likes & Reactions
  LikeOnComment = 1,
  LikeOnForumTopic = 2,
  LikeOnBlogPost = 3,
  LikeOnGuide = 4,
  DislikeOnComment = 5,
  
  // Comments & Replies
  CommentOnForumTopic = 10,
  CommentOnBlogPost = 11,
  CommentOnGuide = 12,
  ReplyToComment = 13,
  BestAnswerSelected = 14,
  
  // Forum Activities
  ForumTopicCreated = 20,
  ForumTopicLocked = 21,
  ForumTopicPinned = 22,
  
  // Content Activities
  BlogPostCreated = 30,
  GuideCreated = 31,
  ContentUpdated = 32,
  ContentFeatured = 33,
  
  // Social Activities
  UserFollowed = 40,
  UserMentioned = 41,
  UserTagged = 42,
  UserProfileViewed = 43,
  FriendRequestSent = 44,
  FriendRequestAccepted = 45,
  FriendRequestRejected = 46,
  MessageReceived = 47,
  
  // Favorites
  ContentAddedToFavorites = 50,
  
  // Game Activities
  GameStatusChanged = 60,
  GameRatingAdded = 61,
  GameReviewAdded = 62,
  
  // Moderation
  ContentReported = 70,
  ContentApproved = 71,
  ContentRejected = 72,
  UserWarned = 73,
  UserBanned = 74,
  
  // System & Admin
  SystemNotification = 80,
  AdminMessage = 81,
  MaintenanceNotice = 82,
  
  // Special Events
  AchievementUnlocked = 90,
  LevelUp = 91,
  SpecialEvent = 92
}

export enum NotificationPriority {
  Low = 1,
  Normal = 2,
  High = 3,
  Critical = 4
}

// Report Types - Updated to match backend
export enum ReportableType {
  Comment = 1,
  Guide = 2,
  BlogPost = 3,
  ForumTopic = 4,
  User = 5
}

export enum ReportType {
  Spam = 1,
  InappropriateContent = 2,
  Harassment = 3,
  CopyrightViolation = 4,
  Misinformation = 5,
  FakeProfile = 6,
  OffensiveLanguage = 7,
  Other = 8
}

export enum ReportStatus {
  Pending = 1,
  UnderReview = 2,
  Approved = 3,
  Rejected = 4,
  Resolved = 5
}

// Report Interfaces
export interface Report {
  id: number;
  reporterId: number;
  reportableType: ReportableType;
  reportableEntityId: number;
  reportType: ReportType;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewedByUserId?: number;
  reviewNotes?: string;
  adminNote?: string; // Added for admin compatibility
  createdDate: string;
  reviewedDate?: string;
  evidence?: string; // JSON array of evidence URLs/data
  reporter?: User;
  reviewedByUser?: User;
}

export interface CreateReportDto {
  reportableType: ReportableType;
  reportableEntityId: number;
  reportType: ReportType;
  reason: string;
  description?: string;
  evidence?: string;
}

export interface UpdateReportDto {
  status?: ReportStatus | string;
  reviewNotes?: string;
  adminNote?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface GameFilterDto {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  platforms?: Platform[] | string[];
  categoryIds?: number[];
  genreIds?: number[];
  tagIds?: number[];
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateCommentDto {
  content: string;
  commentableType: CommentableType;
  commentableEntityId: number;
  parentCommentId?: number;
  hasSpoiler?: boolean;
}

export interface CreateGuideDto {
  title: string;
  summary?: string;
  gameId: number;
  userId: number;
  isPublished?: boolean;
  difficulty?: string;
  estimatedTimeMinutes?: number;
  guideBlocks?: any[];
}

export interface CreateForumTopicDto {
  title: string;
  content: string;
  categoryId: number;
  forumCategoryId: number;
  gameId?: number;
  isSticky?: boolean;
  isLocked?: boolean;
  tags?: string[];
}

// Blog Types
export interface BlogPost {
  id: number;
  title: string;
  slug?: string;
  content: string;
  summary?: string;
  excerpt?: string;
  author?: User;
  authorId: number;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  categories?: string[];
  readTime?: number;
  viewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  // New properties for blog categories and games
  game?: Game;
  category?: BlogCategory;
  tags?: string[];
}

export interface BlogCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
  order: number;
  createdDate: string;
  updatedDate: string;
}

// Updated Report interface for admin pages compatibility
export interface AdminReport {
  id: number;
  title: string;
  description: string;
  reportType: string;
  category: string;
  priority: string;
  status: string;
  reporter?: User;
  reportedEntityType?: string;
  reportedEntityId?: number;
  reportedEntity?: any;
  adminNote?: string;
  adminUser?: User;
  createdAt: string;
  updatedAt: string;
}

// Updated User interface to match pages
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  role: UserRole; // Using enum instead of string
  avatarUrl?: string;
  isActive?: boolean;
  status?: string;
  experiencePoints?: number;
  xp?: number;
  level?: number; // Added level field
  dateOfBirth?: string;
  createdAt: string;
  lastLoginAt?: string;
  isEmailVerified?: boolean;
  isNewUser?: boolean; // For OAuth users requiring profile setup
  location?: string;
  website?: string;
  passwordHash?: string; // Added for API compatibility
  // Privacy Settings
  isProfileVisible?: boolean;
  isActivityStatusVisible?: boolean;
  isGameListVisible?: boolean;
}

// Updated Notification interface to match comprehensive backend
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  imageUrl?: string;
  isRead: boolean;
  isArchived: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  actionUrl?: string;
  triggeredByUserId?: number;
  triggeredByUser?: User;
  createdDate: string;
  readDate?: string;
  expiryDate?: string;
  metadata?: string;
  
  // Helper properties for UI
  timeAgo: string;
  typeIcon: string;
  priorityColor: string;
}

export interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  imageUrl?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  actionUrl?: string;
  triggeredByUserId?: number;
  expiryDate?: string;
  metadata?: string;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  todayNotifications: number;
  weekNotifications: number;
  archivedNotifications: number;
  notificationsByType: { [key: string]: number };
  lastNotificationDate: string;
}

// Game Rating interface
export interface GameRating {
  id: number;
  gameId: number;
  userId: number;
  rating: number;
  review?: string;
  createdDate: string;
  updatedDate?: string;
  user?: User;
  game?: Game;
}