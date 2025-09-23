import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Archive,
  ExternalLink,
  Heart,
  MessageSquare,
  Star,
  User,
  BookOpen,
  Gamepad2,
  Settings,
  AlertTriangle,
  Trophy,
  TrendingUp,
  ThumbsUp,
  Eye,
  Pin,
  UserPlus,
  UserCheck,
  UserX
} from 'lucide-react';
import { notificationAPI, NotificationDto } from '../../services/notificationService';
import { NotificationType, NotificationPriority } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import toast from 'react-hot-toast';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { unreadCount, markAsRead, markAllAsRead, deleteNotification, archiveNotification, isConnected, connectionState } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'dropdown', filter],
    queryFn: async () => {
      if (filter === 'unread') {
        const result = await notificationAPI.getUnreadNotifications();
        console.log('Unread notifications response:', result);
        return result.data || [];
      } else {
        const result = await notificationAPI.getRecentNotifications(20);
        console.log('Recent notifications response:', result);
        return result || [];
      }
    },
    enabled: isAuthenticated && isOpen,
  });

  const queryClient = useQueryClient();

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('Tüm bildirimler okundu olarak işaretlendi');
    queryClient.invalidateQueries({ queryKey: ['notifications', 'dropdown'] });
  };

  // Handle individual actions
  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications', 'dropdown'] });
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    queryClient.invalidateQueries({ queryKey: ['notifications', 'dropdown'] });
  };

  const handleArchive = async (id: number) => {
    await archiveNotification(id);
    queryClient.invalidateQueries({ queryKey: ['notifications', 'dropdown'] });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    const notificationType = type as unknown as NotificationType;
    switch (notificationType) {
      // Beğeni bildirimleri için beğeni ikonu - yeşil
      case NotificationType.LikeOnComment:
      case NotificationType.LikeOnForumTopic:
      case NotificationType.LikeOnBlogPost:
      case NotificationType.LikeOnGuide:
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      
      // Favori ekleme için kalp ikonu - kırmızı
      case NotificationType.ContentAddedToFavorites:
        return <Heart className="w-4 h-4 text-red-500" />;
      
      // Yorum ve yanıtlama için yorum ikonu - mavi
      case NotificationType.CommentOnForumTopic:
      case NotificationType.CommentOnBlogPost:
      case NotificationType.CommentOnGuide:
      case NotificationType.ReplyToComment:
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      
      // Yorum sabitleme için pin ikonu
      case NotificationType.ForumTopicPinned:
        return <Pin className="w-4 h-4 text-yellow-500" />;
      
      // Profil görüntüleme için göz ikonu - mor
      case NotificationType.UserProfileViewed:
        return <Eye className="w-4 h-4 text-purple-500" />;
      
      // Profil takip için kullanıcı ikonu
      case NotificationType.UserFollowed:
        return <User className="w-4 h-4 text-purple-500" />;
      
      // Mention için user ikonu - sarı
      case NotificationType.UserMentioned:
      case NotificationType.UserTagged:
        return <User className="w-4 h-4 text-yellow-500" />;
      
      // Arkadaşlık istekleri için özel ikonlar
      case NotificationType.FriendRequestSent:
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case NotificationType.FriendRequestAccepted:
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case NotificationType.FriendRequestRejected:
        return <UserX className="w-4 h-4 text-red-600" />;
      
      case NotificationType.BestAnswerSelected:
        return <Star className="w-4 h-4 text-yellow-500" />;
      
      case NotificationType.GuideCreated:
      case NotificationType.BlogPostCreated:
        return <BookOpen className="w-4 h-4 text-green-500" />;
      
      case NotificationType.GameStatusChanged:
      case NotificationType.GameRatingAdded:
        return <Gamepad2 className="w-4 h-4 text-indigo-500" />;
      
      case NotificationType.AchievementUnlocked:
        return <Trophy className="w-4 h-4 text-orange-500" />;
      
      case NotificationType.LevelUp:
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      
      case NotificationType.SystemNotification:
        return <Settings className="w-4 h-4 text-gray-500" />;
      
      case NotificationType.AdminMessage:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    const notificationPriority = priority as unknown as NotificationPriority;
    switch (notificationPriority) {
      case NotificationPriority.Critical:
        return 'bg-red-100 text-red-800 border-red-200';
      case NotificationPriority.High:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case NotificationPriority.Normal:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case NotificationPriority.Low:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) {
      return 'Bilinmiyor';
    }
    
    let date: Date | null = null;
    
    // Try multiple parsing methods
    const parseAttempts = [
      // Direct Date constructor
      () => new Date(dateString),
      // Add timezone if missing
      () => dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+') 
        ? new Date(dateString + 'Z') 
        : null,
      // Remove timezone and parse as local
      () => dateString.includes('T') ? new Date(dateString.replace(/[+-]\d{2}:?\d{2}$|Z$/, '')) : null,
      // Try parsing ISO date parts
      () => {
        const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        return match ? new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), 
                               parseInt(match[4]), parseInt(match[5]), parseInt(match[6])) : null;
      }
    ];
    
    for (const attempt of parseAttempts) {
      try {
        const attemptResult = attempt();
        if (attemptResult && !isNaN(attemptResult.getTime())) {
          date = attemptResult;
          break;
        }
      } catch (e) {
        // Continue to next attempt
      }
    }
    
    if (!date || isNaN(date.getTime())) {
      return 'Bilinmiyor';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes}dk önce`;
    if (diffInHours < 24) return `${diffInHours}sa önce`;
    if (diffInDays < 7) return `${diffInDays}g önce`;
    
    try {
      return date.toLocaleDateString('tr-TR');
    } catch (error) {
      return 'Bilinmiyor';
    }
  };

  const handleNotificationClick = (notification: NotificationDto) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    
    // Close dropdown
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        title={`Bildirimler - ${isConnected ? 'Bağlı' : 'Bağlantı kesildi'}`}
      >
        <Bell className="w-6 h-6" />
        
        {/* Connection Status Indicator */}
        <span className={`absolute top-0 left-0 w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-96 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bildirimler
                </h3>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} title={`Canlı bağlantı: ${connectionState}`} />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                  className="text-sm border border-gray-300 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                >
                  <option value="all" className="text-gray-900 dark:text-white">Tümü</option>
                  <option value="unread" className="text-gray-900 dark:text-white">Okunmamış</option>
                </select>
                
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-full flex items-center justify-center transition-colors"
                    title="Tümünü okundu yap"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {notifications.map((notification: NotificationDto) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer overflow-hidden group relative ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon with user avatar overlay */}
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-dark-600 rounded-full">
                          {getNotificationIcon(notification.type)}
                        </div>
                        {notification.metadata && (() => {
                          try {
                            const metadata = JSON.parse(notification.metadata);
                            if (metadata.imageUrl) {
                              return (
                                <img
                                  src={metadata.imageUrl}
                                  alt=""
                                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-dark-800"
                                />
                              );
                            }
                          } catch (e) {
                            // Ignore parse errors
                          }
                          return null;
                        })()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 overflow-hidden" style={{ maxWidth: 'calc(100% - 4rem)' }}>
                            <p className={`text-sm font-medium truncate ${
                              !notification.isRead 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 break-all overflow-hidden hyphens-auto">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-400">
                                {formatTimeAgo(notification.createdAt || (notification as any).createdDate)}
                              </span>
                              
                            </div>
                          </div>

                        </div>
                      </div>
                      
                      {/* Hover'da görünen okundu butonu - sağ üst köşede */}
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Okundu olarak işaretle"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      
                      {/* Sil ve arşiv butonları - sağ alt köşede */}
                      <div className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-yellow-600 transition-colors bg-white dark:bg-dark-800 rounded-full shadow-sm"
                          title="Arşivle"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors bg-white dark:bg-dark-800 rounded-full shadow-sm"
                          title="Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-dark-700">
              <a
                href="/notifications"
                className="block text-center text-sm text-primary-600 hover:text-primary-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Tüm bildirimleri görüntüle
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;