import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationAPI, NotificationDto } from '../services/notificationService';
import { signalRService } from '../services/signalrService';
import { useAuth } from './useAuth';
import NotificationToast from '../components/common/NotificationToast';
import { Notification, NotificationType, NotificationPriority } from '../types';
import toast from 'react-hot-toast';

type ToastNotification = Omit<Notification, 'id'> & { id: string; originalId: number };

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  showToast: (notification: NotificationDto) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  archiveNotification: (id: number) => void;
  isLoading: boolean;
  isConnected: boolean;
  connectionState: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [realTimeUnreadCount, setRealTimeUnreadCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('Disconnected');

  // Get unread count (use real-time count if available, otherwise fallback to query)
  const { data: queryUnreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationAPI.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: realTimeUnreadCount === null ? 30000 : false, // Only refresh if no real-time data
  });

  const unreadCount = realTimeUnreadCount ?? queryUnreadCount;

  // Helper functions for data conversion
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes}dk önce`;
    if (diffInHours < 24) return `${diffInHours}sa önce`;
    if (diffInDays < 7) return `${diffInDays}g önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const getImageUrlFromMetadata = (metadata?: string): string | undefined => {
    if (!metadata) return undefined;
    try {
      const parsed = JSON.parse(metadata);
      return parsed.imageUrl;
    } catch {
      return undefined;
    }
  };

  const getUserFromMetadata = (metadata?: string): any => {
    if (!metadata) return undefined;
    try {
      const parsed = JSON.parse(metadata);
      return parsed.triggeredByUser ? {
        id: parsed.triggeredByUser.id || 0,
        username: parsed.triggeredByUser.username || '',
        email: parsed.triggeredByUser.email || '',
        role: parsed.triggeredByUser.role || 0,
        createdAt: parsed.triggeredByUser.createdAt || new Date().toISOString()
      } : undefined;
    } catch {
      return undefined;
    }
  };

  // Get recent notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationAPI.getRecentNotifications(20),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  // Show toast notification
  const showToast = (notification: NotificationDto) => {
    const toastId = `${notification.id}-${Date.now()}`;
    const { id: originalId, ...notificationWithoutId } = notification;
    
    // Convert NotificationDto to Notification format for toast
    const toastNotification: ToastNotification = {
      id: toastId,
      originalId,
      title: notification.title,
      message: notification.message,
      type: notification.type as unknown as NotificationType,
      priority: notification.priority as unknown as NotificationPriority,
      isRead: notification.isRead,
      createdDate: notification.createdAt,
      timeAgo: getTimeAgo(notification.createdAt),
      userId: 0, // Default value for toast
      isArchived: false, // Default value for toast
      typeIcon: '', // Will be determined by component
      priorityColor: '', // Will be determined by component
      imageUrl: getImageUrlFromMetadata(notification.metadata),
      triggeredByUser: getUserFromMetadata(notification.metadata),
      readDate: notification.readAt,
      metadata: notification.metadata,
      actionUrl: notification.actionUrl
    };
    
    setToastNotifications(prev => [...prev, toastNotification]);
  };

  // Remove toast notification
  const removeToast = (toastId: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== toastId));
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: number) => {
    try {
      await notificationAPI.deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Archive notification
  const archiveNotification = async (id: number) => {
    try {
      await notificationAPI.archiveNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  // Handle notification action (navigate to URL)
  const handleNotificationAction = (notification: ToastNotification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification.originalId);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  // SignalR connection and real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      signalRService.stopConnection();
      setIsConnected(false);
      setConnectionState('Disconnected');
      setRealTimeUnreadCount(null);
      return;
    }

    // Set up SignalR event handlers
    signalRService.setOnNotificationReceived((notification) => {
      console.log('Real-time notification received:', notification);
      
      // Convert SignalR notification to NotificationDto format 
      const notificationDto: NotificationDto = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type as unknown as string,
        priority: notification.priority as unknown as string,
        isRead: notification.isRead || false,
        createdAt: (notification as any).createdDate || (notification as any).createdAt || new Date().toISOString(),
        readAt: (notification as any).readDate,
        metadata: notification.metadata,
        actionUrl: notification.actionUrl
      };
      
      // Check if it's a message notification
      const notificationType = notification.type as unknown as NotificationType;
      
      if (notificationType === NotificationType.MessageReceived) {
        // For messages, only show toast, don't add to notification list
        toast.success(`💬 ${notification.title}`, {
          duration: 4000,
          position: 'top-right',
        });
        
        // Update unread message count instead of notifications
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } else {
        // For other notifications, show toast and add to notification list
        showToast(notificationDto);
        
        // Invalidate queries to refresh notification list
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    signalRService.setOnUnreadCountUpdated((count) => {
      console.log('Real-time unread count updated:', count);
      setRealTimeUnreadCount(count);
    });

    signalRService.setOnSystemNotification((systemNotification) => {
      console.log('System notification received:', systemNotification);
      toast(systemNotification.message, {
        duration: 6000,
        icon: '🔔',
      });
    });

    // Start SignalR connection
    const connectSignalR = async () => {
      try {
        await signalRService.startConnection();
        setIsConnected(signalRService.connected);
        setConnectionState(signalRService.connectionState);
      } catch (error) {
        console.error('Failed to connect to SignalR:', error);
      }
    };

    connectSignalR();

    // Monitor connection state
    const connectionMonitor = setInterval(() => {
      setIsConnected(signalRService.connected);
      setConnectionState(signalRService.connectionState);
    }, 1000);

    return () => {
      clearInterval(connectionMonitor);
      // Don't disconnect here as other components might be using it
      // signalRService.stopConnection();
    };
  }, [isAuthenticated, user, queryClient]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    showToast,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    isLoading,
    isConnected,
    connectionState
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toastNotifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeToast(notification.id)}
            onAction={() => handleNotificationAction(notification)}
            autoClose={true}
            duration={5000}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};