import { api } from './api';

export interface MessageDto {
  id: number;
  content: string;
  type: string;
  mediaUrl?: string;
  mediaType?: string;
  sender: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  replyToMessage?: {
    id: number;
    content: string;
    mediaUrl?: string;
    sender: {
      id: number;
      username: string;
      avatarUrl?: string;
    };
  };
  reactions: {
    emoji: string;
    count: number;
    users: { userId: number; username: string }[];
  }[];
  isEdited: boolean;
  createdAt: string;
  editedAt?: string;
}

export const messageAPI = {
  // Get total unread message count for user
  getTotalUnreadCount: async (): Promise<number> => {
    const response = await api.get('/message/unread-count');
    return response.data;
  },

  // Mark conversation messages as read
  markConversationAsRead: async (conversationId: number): Promise<{ message: string }> => {
    const response = await api.post(`/message/conversation/${conversationId}/mark-read`);
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/message/${messageId}`);
    return response.data;
  }
};

export default messageAPI;