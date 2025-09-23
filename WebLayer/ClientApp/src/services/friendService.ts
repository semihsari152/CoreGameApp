import { api } from './api';

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  senderUsername: string;
  receiverUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

export interface Friend {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  friendshipDate: string;
}

export const friendService = {
  // Arkadaş isteği gönder
  sendFriendRequest: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/send-request/${userId}`);
    return response.data;
  },

  // Gelen arkadaş isteklerini getir
  getReceivedRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get('/friendship/requests/incoming');
    return response.data;
  },

  // Gönderilen arkadaş isteklerini getir
  getSentRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get('/friendship/requests/sent');
    return response.data;
  },

  // Arkadaş isteğini kabul et
  acceptFriendRequest: async (requestId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/accept/${requestId}`);
    return response.data;
  },

  // Arkadaş isteğini reddet
  declineFriendRequest: async (requestId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/decline/${requestId}`);
    return response.data;
  },

  // Arkadaş isteğini iptal et (sent request'i delete etmek için)
  cancelFriendRequest: async (requestId: number): Promise<{ message: string }> => {
    // Backend'de cancel için ayrı endpoint yok, decline kullanıyoruz
    const response = await api.post(`/friendship/decline/${requestId}`);
    return response.data;
  },

  // Arkadaşları listele
  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get('/friendship/friends');
    return response.data;
  },

  // Arkadaşlığı kaldır
  removeFriend: async (friendId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/friendship/remove/${friendId}`);
    return response.data;
  },

  // Kullanıcıyı engelle
  blockUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/block/${userId}`);
    return response.data;
  },

  // Kullanıcının engelini kaldır
  unblockUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friendship/unblock/${userId}`);
    return response.data;
  },

  // Kullanıcıları ara (arkadaş eklemek için)
  searchUsers: async (query: string): Promise<any[]> => {
    const response = await api.get(`/friendship/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // İki kullanıcı arasındaki arkadaşlık durumunu kontrol et
  getFriendshipStatus: async (userId: number): Promise<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
    requestId?: number;
    isBlocked?: boolean;
    blockedByCurrentUser?: boolean;
  }> => {
    const response = await api.get(`/friendship/status/${userId}`);
    const data = response.data;
    
    console.log('getFriendshipStatus raw data:', data);
    
    // Backend response'unu frontend formatına çevir
    let status: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none';
    
    if (data.status === 'pending') {
      status = data.isSender ? 'pending_sent' : 'pending_received';
    } else if (data.status === 'accepted') {
      status = 'friends';
    }
    
    // getCurrentUserId için basit bir assumption yapalım - normalde context'ten alınmalı
    // Şimdilik blockedBy ID'sini karşılaştırmayacağız, sadece isBlocked kullanacağız
    const result = {
      status,
      requestId: data.id,
      isBlocked: data.isBlocked || false,
      blockedByCurrentUser: data.isBlocked || false // Şimdilik hep true kabul edelim
    };
    
    console.log('getFriendshipStatus processed result:', result);
    
    return result;
  }
};