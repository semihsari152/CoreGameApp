import { api } from './api';
import { Conversation, CreateGroupConversationRequest } from '../types/messaging';

export const conversationService = {
  // Kullanıcının tüm konuşmalarını getir
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/conversation');
    return response.data;
  },

  // Belirli bir konuşmayı getir
  getConversation: async (conversationId: number, skip: number = 0, take: number = 50): Promise<Conversation> => {
    const response = await api.get(`/conversation/${conversationId}?skip=${skip}&take=${take}`);
    return response.data;
  },

  // Direkt mesaj konuşması başlat veya mevcut konuşmayı getir
  startDirectMessage: async (userId: number): Promise<{ conversationId: number; isNewConversation: boolean }> => {
    const response = await api.post(`/conversation/direct/${userId}`);
    return response.data;
  },

  // Direkt konuşma oluştur (ChatPage için)
  createDirectConversation: async (userId: number): Promise<Conversation> => {
    const result = await conversationService.startDirectMessage(userId);
    return await conversationService.getConversation(result.conversationId);
  },

  // Grup konuşması oluştur
  createGroupConversation: async (request: CreateGroupConversationRequest): Promise<{ conversationId: number; message: string }> => {
    const response = await api.post('/conversation/group', request);
    return response.data;
  },

  // Gruba katılımcı ekle
  addParticipant: async (conversationId: number, userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/conversation/${conversationId}/participants`, { userId });
    return response.data;
  },

  // Gruptan katılımcı at (sadece grup sahibi)
  kickParticipant: async (conversationId: number, userId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/conversation/${conversationId}/participants/${userId}`);
    return response.data;
  },

  // Konuşmadan ayrıl
  leaveConversation: async (conversationId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/conversation/${conversationId}/leave`);
    return response.data;
  },

  // Konuşmaları ara
  searchConversations: async (query: string): Promise<Conversation[]> => {
    const response = await api.get(`/conversation/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Konuşmadaki mesajları okundu olarak işaretle
  markConversationAsRead: async (conversationId: number): Promise<{ message: string }> => {
    const response = await api.post(`/message/conversation/${conversationId}/mark-read`);
    return response.data;
  },

  // Mesaj sil
  deleteMessage: async (messageId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/message/${messageId}`);
    return response.data;
  },

  // Konuşmadaki tüm mesajları temizle
  clearMessages: async (conversationId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/conversation/${conversationId}/messages`);
    return response.data;
  }
};