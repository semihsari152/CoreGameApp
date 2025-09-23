namespace DomainLayer.Enums
{
    public enum NotificationType
    {
        // Likes & Reactions
        LikeOnComment = 1,
        LikeOnForumTopic = 2,
        LikeOnBlogPost = 3,
        LikeOnGuide = 4,
        DislikeOnComment = 5,
        LikeOnUser = 6,
        
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
        BlogPostPublished = 30,
        GuidePublished = 31,
        ContentApproved = 32,
        ContentRejected = 33,
        ContentFeatured = 34,
        
        // Social Activities
        UserFollowed = 40,
        UserMentioned = 41,
        NewFollowerContent = 42,
        ProfileViewed = 43,
        CommentPinned = 44,
        
        // Favorites
        ContentAddedToFavorites = 50,
        FavoriteContentUpdated = 51,
        
        // Game Activities
        GameRatingAdded = 60,
        GameAddedToList = 61,
        GameStatusChanged = 62,
        
        // Moderation
        ContentReported = 70,
        ReportResolved = 71,
        UserWarned = 72,
        UserBanned = 73,
        UserUnbanned = 74,
        
        // System & Admin
        SystemNotification = 80,
        AdminMessage = 81,
        Welcome = 82,
        AchievementUnlocked = 83,
        LevelUp = 84,
        
        // Special Events
        ContestAnnouncement = 90,
        SpecialEvent = 91,
        Maintenance = 92
    }
}