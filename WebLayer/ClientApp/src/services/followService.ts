import { api } from './api';
import { FollowUser, FollowStatus, FollowStats } from '../types/social';

interface PaginatedResponse<T> {
  users: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const followService = {
  // Kullanıcıyı takip et
  followUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/follow/follow/${userId}`);
    return response.data;
  },

  // Kullanıcıyı takip etmeyi bırak
  unfollowUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/follow/unfollow/${userId}`);
    return response.data;
  },

  // Takip ettiğim kullanıcılar
  getFollowing: async (page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<FollowUser>> => {
    const response = await api.get(`/follow/following?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Takipçilerim
  getFollowers: async (page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<FollowUser>> => {
    const response = await api.get(`/follow/followers?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Kullanıcının takipçi/takip istatistikleri
  getFollowStats: async (userId?: number): Promise<FollowStats> => {
    const url = userId ? `/follow/stats/${userId}` : '/follow/stats';
    const response = await api.get(url);
    return response.data;
  },

  // Takip durumunu kontrol et
  getFollowStatus: async (userId: number): Promise<FollowStatus> => {
    const response = await api.get(`/follow/status/${userId}`);
    return response.data;
  },

  // Bildirim ayarlarını güncelle
  updateNotificationSettings: async (userId: number, enabled: boolean): Promise<{ message: string; notificationsEnabled: boolean }> => {
    const response = await api.put(`/follow/notifications/${userId}`, enabled);
    return response.data;
  },

  // Kullanıcı önerileri
  getFollowSuggestions: async (limit: number = 10): Promise<FollowUser[]> => {
    const response = await api.get(`/follow/suggestions?limit=${limit}`);
    return response.data;
  }
};