import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, 
  Heart,
  MessageSquare,
  Star,
  User,
  BookOpen,
  Gamepad2,
  Trophy,
  TrendingUp,
  Settings,
  AlertTriangle,
  Bell,
  ThumbsUp,
  Eye,
  Pin
} from 'lucide-react';
import { Notification, NotificationType, NotificationPriority } from '../../types';

type ToastNotification = Omit<Notification, 'id'> & { id: string; originalId: number };

interface NotificationToastProps {
  notification: ToastNotification;
  onClose: () => void;
  onAction?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, handleClose]);

  const handleToastClick = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      // Beğeni bildirimleri için beğeni ikonu - yeşil
      case NotificationType.LikeOnComment:
      case NotificationType.LikeOnForumTopic:
      case NotificationType.LikeOnBlogPost:
      case NotificationType.LikeOnGuide:
        return <ThumbsUp className={`${iconClass} text-green-500`} />;
      
      // Favori ekleme için kalp ikonu - kırmızı
      case NotificationType.ContentAddedToFavorites:
        return <Heart className={`${iconClass} text-red-500`} />;
      
      // Yorum ve yanıtlama için yorum ikonu - mavi
      case NotificationType.CommentOnForumTopic:
      case NotificationType.CommentOnBlogPost:
      case NotificationType.CommentOnGuide:
      case NotificationType.ReplyToComment:
        return <MessageSquare className={`${iconClass} text-blue-500`} />;
      
      // Yorum sabitleme için pin ikonu
      case NotificationType.ForumTopicPinned:
        return <Pin className={`${iconClass} text-yellow-500`} />;
      
      // Profil görüntüleme için göz ikonu - mor
      case NotificationType.UserProfileViewed:
        return <Eye className={`${iconClass} text-purple-500`} />;
      
      // Profil takip için kullanıcı ikonu
      case NotificationType.UserFollowed:
        return <User className={`${iconClass} text-purple-500`} />;
      
      // Mention için user ikonu - sarı
      case NotificationType.UserMentioned:
      case NotificationType.UserTagged:
        return <User className={`${iconClass} text-yellow-500`} />;
      
      case NotificationType.BestAnswerSelected:
        return <Star className={`${iconClass} text-yellow-500`} />;
      
      case NotificationType.GuideCreated:
      case NotificationType.BlogPostCreated:
        return <BookOpen className={`${iconClass} text-green-500`} />;
      
      case NotificationType.GameStatusChanged:
      case NotificationType.GameRatingAdded:
        return <Gamepad2 className={`${iconClass} text-indigo-500`} />;
      
      case NotificationType.AchievementUnlocked:
        return <Trophy className={`${iconClass} text-orange-500`} />;
      
      case NotificationType.LevelUp:
        return <TrendingUp className={`${iconClass} text-emerald-500`} />;
      
      case NotificationType.SystemNotification:
        return <Settings className={`${iconClass} text-gray-500`} />;
      
      case NotificationType.AdminMessage:
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getPriorityBorderColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.Critical:
        return 'border-l-red-500';
      case NotificationPriority.High:
        return 'border-l-orange-500';
      case NotificationPriority.Normal:
        return 'border-l-blue-500';
      case NotificationPriority.Low:
        return 'border-l-gray-400';
      default:
        return 'border-l-blue-500';
    }
  };

  const getPriorityBadgeColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.Critical:
        return 'bg-red-100 text-red-800 border-red-200';
      case NotificationPriority.High:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case NotificationPriority.Normal:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case NotificationPriority.Low:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 transform transition-all duration-300 z-50 ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
        onClick={handleToastClick}
      >
        <div className="flex items-start space-x-3">
          {/* Icon with optional avatar overlay */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-dark-600 rounded-full">
              {getNotificationIcon(notification.type)}
            </div>
            {notification.imageUrl && (
              <img
                src={notification.imageUrl}
                alt=""
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-dark-800"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  {notification.triggeredByUser && (
                    <span className="text-xs text-gray-500">
                      {notification.triggeredByUser.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="mt-3 h-1 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${
                notification.priority === NotificationPriority.Critical 
                  ? 'from-red-500 to-red-600'
                  : notification.priority === NotificationPriority.High
                  ? 'from-orange-500 to-orange-600'
                  : 'from-blue-500 to-blue-600'
              } rounded-full`}
              style={{
                animation: `progress-shrink ${duration}ms linear forwards`,
                width: '100%'
              }}
            />
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes progress-shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationToast;