// Mesajlaşma Sistemi için Type'lar

export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  displayName?: string;
}

export interface ConversationParticipant extends User {
  role: 'member' | 'admin' | 'owner';
  joinedAt: string;
}

export interface MessageReaction {
  emoji: string;
  userId: number;
  username: string;
}

export interface Message {
  id: number;
  conversationId: number;
  content?: string;
  type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'file' | 'system' | 'link';
  mediaUrl?: string;
  mediaType?: string;
  sender: User;
  replyToMessage?: {
    id: number;
    content?: string;
    mediaUrl?: string;
    sender: User;
  };
  reactions: MessageReaction[];
  isEdited: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  editedAt?: string;
}

export interface Conversation {
  id: number;
  type: 'directmessage' | 'groupchat';
  title?: string;
  description?: string;
  groupImageUrl?: string;
  participants: ConversationParticipant[];
  lastMessage?: {
    id: number;
    content?: string;
    type: string;
    mediaUrl?: string;
    sender: User;
    createdAt: string;
  };
  messages?: Message[];
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface CreateGroupConversationRequest {
  title: string;
  description?: string;
  groupImageUrl?: string;
  participantIds: number[];
}

export interface SendMessageRequest {
  conversationId: number;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  replyToMessageId?: number;
}

// SignalR Event Types
export interface TypingIndicator {
  conversationId: number;
  userId: number;
  username: string;
}

export interface MessageReadEvent {
  messageId: number;
  userId: number;
  readAt: string;
}

export interface ReactionUpdateEvent {
  messageId: number;
  reactions: MessageReaction[];
}