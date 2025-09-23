import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Archive,
  Filter,
  Calendar,
  User,
  MessageSquare,
  Heart,
  Star,
  BookOpen,
  Settings,
  Gamepad2,
  Trophy,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  Eye,
  Pin,
  UserPlus,
  UserCheck,
  UserX
} from 'lucide-react';
import { notificationAPI, NotificationDto } from '../services/notificationService';
import { NotificationType, NotificationPriority } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const NotificationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | string>('all');

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', statusFilter, contentTypeFilter, entityTypeFilter],
    queryFn: async () => {
      const result = await notificationAPI.getNotifications(1, 50);
      console.log('NotificationsPage - Full notifications response:', result);
      let filteredData = result.data || [];
      
      if (filteredData.length > 0) {
        console.log('First notification sample:', filteredData[0]);
      }
      
      // Apply content type filter
      if (contentTypeFilter !== 'all') {
        filteredData = filteredData.filter(n => {
          const typeLabel = getNotificationTypeLabel(n.type as unknown as NotificationType);
          return typeLabel === contentTypeFilter;
        });
      }
      
      // Apply entity type filter
      if (entityTypeFilter !== 'all') {
        filteredData = filteredData.filter(n => {
          const entityType = getEntityTypeFromNotification(n.type as unknown as NotificationType);
          return entityType === entityTypeFilter;
        });
      }
      
      return { data: filteredData };
    },
    enabled: isAuthenticated
  });

  // Fetch notification stats
  const { data: stats } = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => notificationAPI.getStats(),
    enabled: isAuthenticated
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationAPI.deleteNotification(id),
    onSuccess: () => {
      toast.success('Bildirim silindi');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Silme işlemi sırasında bir hata oluştu');
    }
  });

  // Archive notification mutation
  const archiveNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationAPI.archiveNotification(id),
    onSuccess: () => {
      toast.success('Bildirim arşivlendi');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('Arşivleme işlemi sırasında bir hata oluştu');
    }
  });

  const formatDate = (dateString: string) => {
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

    if (diffInMinutes < 1) {
      return 'Az önce';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInDays < 7) {
      return `${diffInDays} gün önce`;
    } else {
      try {
        return date.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Bilinmiyor';
      }
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      // Beğeni bildirimleri için beğeni ikonu - yeşil
      case NotificationType.LikeOnComment:
      case NotificationType.LikeOnForumTopic:
      case NotificationType.LikeOnBlogPost:
      case NotificationType.LikeOnGuide:
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      
      // Favori ekleme için kalp ikonu - kırmızı
      case NotificationType.ContentAddedToFavorites:
        return <Heart className="w-5 h-5 text-red-600" />;
      
      // Yorum ve yanıtlama için yorum ikonu - mavi
      case NotificationType.CommentOnForumTopic:
      case NotificationType.CommentOnBlogPost:
      case NotificationType.CommentOnGuide:
      case NotificationType.ReplyToComment:
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      
      // Yorum sabitleme için pin ikonu
      case NotificationType.ForumTopicPinned:
        return <Pin className="w-5 h-5 text-yellow-600" />;
      
      // Profil görüntüleme için göz ikonu - mor
      case NotificationType.UserProfileViewed:
        return <Eye className="w-5 h-5 text-purple-600" />;
      
      // Profil takip için kullanıcı ikonu
      case NotificationType.UserFollowed:
        return <User className="w-5 h-5 text-purple-600" />;
      
      // Mention için user ikonu - sarı
      case NotificationType.UserMentioned:
      case NotificationType.UserTagged:
        return <User className="w-5 h-5 text-yellow-600" />;
      
      // Arkadaşlık istekleri için özel ikonlar
      case NotificationType.FriendRequestSent:
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case NotificationType.FriendRequestAccepted:
        return <UserCheck className="w-5 h-5 text-green-600" />;
      case NotificationType.FriendRequestRejected:
        return <UserX className="w-5 h-5 text-red-600" />;
      
      case NotificationType.BestAnswerSelected:
        return <Star className="w-5 h-5 text-yellow-600" />;
      
      case NotificationType.GuideCreated:
      case NotificationType.BlogPostCreated:
        return <BookOpen className="w-5 h-5 text-green-600" />;
      
      case NotificationType.GameStatusChanged:
      case NotificationType.GameRatingAdded:
        return <Gamepad2 className="w-5 h-5 text-indigo-600" />;
      
      case NotificationType.AchievementUnlocked:
        return <Trophy className="w-5 h-5 text-orange-600" />;
      
      case NotificationType.LevelUp:
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      
      case NotificationType.SystemNotification:
        return <Settings className="w-5 h-5 text-gray-600" />;
      
      case NotificationType.AdminMessage:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.Critical:
        return 'text-red-600 bg-red-50 border-red-200';
      case NotificationPriority.High:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case NotificationPriority.Normal:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case NotificationPriority.Low:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LikeOnComment:
      case NotificationType.LikeOnForumTopic:
      case NotificationType.LikeOnBlogPost:
      case NotificationType.LikeOnGuide:
        return 'Beğeni';
      case NotificationType.CommentOnForumTopic:
      case NotificationType.CommentOnBlogPost:
      case NotificationType.CommentOnGuide:
        return 'Yorum';
      case NotificationType.ReplyToComment:
        return 'Cevap';
      case NotificationType.BestAnswerSelected:
        return 'En İyi Cevap';
      case NotificationType.UserFollowed:
        return 'Takip';
      case NotificationType.UserProfileViewed:
        return 'Profil Görüntüleme';
      case NotificationType.ContentAddedToFavorites:
        return 'Favori';
      case NotificationType.GameStatusChanged:
        return 'Oyun Durumu';
      case NotificationType.AchievementUnlocked:
        return 'Başarım';
      case NotificationType.LevelUp:
        return 'Seviye Atlama';
      case NotificationType.SystemNotification:
        return 'Sistem';
      case NotificationType.AdminMessage:
        return 'Yönetici';
      case NotificationType.UserMentioned:
      case NotificationType.UserTagged:
        return 'Mention';
      case NotificationType.FriendRequestSent:
      case NotificationType.FriendRequestAccepted:
      case NotificationType.FriendRequestRejected:
        return 'Arkadaşlık İsteği';
      case NotificationType.ForumTopicPinned:
        return 'Sabitleme';
      default:
        return 'Bildirim';
    }
  };
  
  const getEntityTypeFromNotification = (type: NotificationType) => {
    switch (type) {
      case NotificationType.LikeOnGuide:
      case NotificationType.CommentOnGuide:
      case NotificationType.GuideCreated:
        return 'Guide';
      case NotificationType.LikeOnBlogPost:
      case NotificationType.CommentOnBlogPost:
      case NotificationType.BlogPostCreated:
        return 'Blog';
      case NotificationType.LikeOnForumTopic:
      case NotificationType.CommentOnForumTopic:
      case NotificationType.ForumTopicCreated:
      case NotificationType.ForumTopicPinned:
      case NotificationType.BestAnswerSelected:
        return 'Forum';
      case NotificationType.GameStatusChanged:
      case NotificationType.GameRatingAdded:
        return 'Oyun';
      case NotificationType.UserFollowed:
      case NotificationType.UserProfileViewed:
      case NotificationType.UserMentioned:
      case NotificationType.UserTagged:
      case NotificationType.FriendRequestSent:
      case NotificationType.FriendRequestAccepted:
      case NotificationType.FriendRequestRejected:
        return 'Profil';
      default:
        return 'Diğer';
    }
  };
  
  const getContentTypes = () => {
    return [
      { value: 'Beğeni', label: 'Beğeni' },
      { value: 'Yorum', label: 'Yorum' },
      { value: 'Cevap', label: 'Cevap' },
      { value: 'Takip', label: 'Takip' },
      { value: 'Profil Görüntüleme', label: 'Profil Görüntüleme' },
      { value: 'Favori', label: 'Favori' },
      { value: 'Mention', label: 'Mention' },
      { value: 'Arkadaşlık İsteği', label: 'Arkadaşlık İsteği' },
      { value: 'Sabitleme', label: 'Sabitleme' },
      { value: 'Sistem', label: 'Sistem' },
      { value: 'Yönetici', label: 'Yönetici' }
    ];
  };
  
  const getEntityTypes = () => {
    return [
      { value: 'Guide', label: 'Rehber' },
      { value: 'Blog', label: 'Blog' },
      { value: 'Forum', label: 'Forum' },
      { value: 'Oyun', label: 'Oyun' },
      { value: 'Profil', label: 'Profil' },
      { value: 'Diğer', label: 'Diğer' }
    ];
  };
  
  const getNotificationTypeColor = (type: NotificationType) => {
    const typeLabel = getNotificationTypeLabel(type);
    switch (typeLabel) {
      case 'Beğeni':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Yorum':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Cevap':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Favori':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Mention':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Takip':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Profil Görüntüleme':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Sabitleme':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Sistem':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'Yönetici':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const handleArchive = (id: number) => {
    archiveNotificationMutation.mutate(id);
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
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bildirimlerinizi görmek için giriş yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-gaming font-bold text-gray-900 dark:text-white">
                Bildirimler
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{notifications?.data?.length || 0} bildirim</span>
                {stats && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">{stats.unreadCount} okunmamış</span>
                    <span>•</span>
                    <span className="text-yellow-600">{stats.totalCount} toplam</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter - okundu/arşiv */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="unread">Okunmamış</option>
                <option value="read">Okunmuş</option>
                <option value="archived">Arşivlenmiş</option>
              </select>

              {/* Content Type Filter - beğeni, yorum vs */}
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="input text-sm"
              >
                <option value="all">Tüm İçerik Türleri</option>
                {getContentTypes().map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              {/* Entity Type Filter - guide, blog, forum vs */}
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="input text-sm"
              >
                <option value="all">Tüm Varlık Türleri</option>
                {getEntityTypes().map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              {/* Clear filters */}
              {(statusFilter !== 'all' || contentTypeFilter !== 'all' || entityTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setContentTypeFilter('all');
                    setEntityTypeFilter('all');
                  }}
                  className="btn-secondary text-sm text-gray-600 hover:text-gray-800"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtreleri Temizle
                </button>
              )}

              {/* Mark all as read */}
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isLoading}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Tümünü Okundu Yap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Bildirimler yükleniyor...</p>
            </div>
          </div>
        ) : !notifications?.data || notifications.data.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {statusFilter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'unread' 
                ? 'Tüm bildirimlerinizi okumuşsunuz.'
                : 'Yeni aktiviteler olduğunda burada görünecek.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.data.map((notification: NotificationDto) => (
              <div
                key={notification.id}
                className={`card p-4 transition-all duration-200 hover:shadow-md cursor-pointer group ${
                  !notification.isRead 
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-primary-500' 
                    : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon with avatar overlay */}
                  <div className="relative flex-shrink-0 pt-1">
                    {getNotificationIcon(notification.type as unknown as NotificationType)}
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
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.isRead 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(notification.createdAt || (notification as any).createdDate)}</span>
                          </div>
                          
                          {notification.metadata && (() => {
                            try {
                              const metadata = JSON.parse(notification.metadata);
                              if (metadata.triggeredByUser) {
                                return (
                                  <div className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{metadata.triggeredByUser.username}</span>
                                  </div>
                                );
                              }
                            } catch (e) {
                              // Ignore parse errors
                            }
                            return null;
                          })()}
                          
                          
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            getNotificationTypeColor(notification.type as unknown as NotificationType)
                          }`}>
                            {getNotificationTypeLabel(notification.type as unknown as NotificationType)}
                          </span>
                          
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            disabled={markAsReadMutation.isLoading}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            title="Okundu olarak işaretle"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {true && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(notification.id);
                            }}
                            disabled={archiveNotificationMutation.isLoading}
                            className="p-1 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                            title="Arşivle"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          disabled={deleteNotificationMutation.isLoading}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;