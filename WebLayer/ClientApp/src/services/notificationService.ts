import { api } from './api';

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: string;
  entityId?: number;
  entityType?: string;
  actionUrl?: string;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
  readCount: number;
}

export const notificationAPI = {
  // Get user's notifications with pagination
  getNotifications: async (page: number = 1, pageSize: number = 20): Promise<{ data: NotificationDto[] }> => {
    const response = await api.get(`/notifications?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Get unread notifications
  getUnreadNotifications: async (): Promise<{ data: NotificationDto[] }> => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Get recent notifications (for dropdown)
  getRecentNotifications: async (count: number = 10): Promise<NotificationDto[]> => {
    const response = await api.get(`/notifications/recent/${count}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<{ message: string }> => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Archive notification
  archiveNotification: async (notificationId: number): Promise<{ message: string }> => {
    const response = await api.post(`/notifications/${notificationId}/archive`);
    return response.data;
  },

  // Delete old notifications
  deleteOldNotifications: async (daysOld: number = 30): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/old?daysOld=${daysOld}`);
    return response.data;
  },

  // Get notification statistics
  getStats: async (): Promise<NotificationStats> => {
    const response = await api.get('/notifications/stats');
    return response.data;
  }
};

export default notificationAPI;