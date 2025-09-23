import { api } from './api';
import { friendService } from './friendService';

export interface FriendSuggestion {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  mutualFriends: number;
  isOnline: boolean;
}

export interface SearchResult {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  isOnline: boolean;
}

export interface PopularUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  friendCount: number;
  isOnline: boolean;
}

export const friendshipAPI = {
  // Send friend request
  sendFriendRequest: async (receiverId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/send-request/${receiverId}`);
    return response.data;
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/accept/${friendshipId}`);
    return response.data;
  },

  // Decline friend request
  declineFriendRequest: async (friendshipId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/decline/${friendshipId}`);
    return response.data;
  },

  // Cancel friend request
  cancelFriendRequest: async (requestId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/friendship/cancel/${requestId}`);
    return response.data;
  },

  // Block user
  blockUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/block/${userId}`);
    return response.data;
  },

  // Unblock user
  unblockUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/unblock/${userId}`);
    return response.data;
  },

  // Get friends list
  getFriends: async (): Promise<any[]> => {
    const response = await api.get('/friendship/friends');
    return response.data;
  },

  // Get incoming friend requests
  getIncomingRequests: async (): Promise<any[]> => {
    const response = await api.get('/friendship/requests/incoming');
    return response.data;
  },

  // Get sent friend requests
  getSentRequests: async (): Promise<any[]> => {
    const response = await api.get('/friendship/requests/sent');
    return response.data;
  },

  // Get friendship status
  getFriendshipStatus: async (userId: number): Promise<any> => {
    const response = await api.get(`/friendship/status/${userId}`);
    return response.data;
  },

  // Friend suggestions
  getSuggestions: async (limit: number = 10): Promise<FriendSuggestion[]> => {
    const response = await api.get(`/friendship/suggestions?limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query: string, limit: number = 20): Promise<SearchResult[]> => {
    const response = await api.get(`/friendship/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get popular users
  getPopularUsers: async (limit: number = 15): Promise<PopularUser[]> => {
    const response = await api.get(`/friendship/popular?limit=${limit}`);
    return response.data;
  }
};

// Get blocked users endpoint
const getBlockedUsers = async (): Promise<any[]> => {
  const response = await api.get('/friendship/blocked');
  return response.data;
};

// friendshipService for new FriendsManagement page
export const friendshipService = {
  getFriends: () => friendshipAPI.getFriends(),
  getPendingRequests: () => friendshipAPI.getIncomingRequests(),
  getSentRequests: () => friendshipAPI.getSentRequests(),
  getBlockedUsers: () => getBlockedUsers(),
  sendFriendRequest: (userId: number) => friendshipAPI.sendFriendRequest(userId),
  acceptFriendRequest: (requestId: number) => friendshipAPI.acceptFriendRequest(requestId),
  rejectFriendRequest: (requestId: number) => friendshipAPI.declineFriendRequest(requestId),
  cancelFriendRequest: (requestId: number) => friendshipAPI.cancelFriendRequest(requestId),
  removeFriend: (friendId: number) => friendService.removeFriend(friendId),
  blockUser: (userId: number) => friendshipAPI.blockUser(userId),
  unblockUser: (userId: number) => friendshipAPI.unblockUser(userId),
};

export default friendshipAPI;
