import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Search, 
  Users, 
  Plus,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import { Conversation } from '../../types/messaging';
import { useAuth } from '../../hooks/useAuth';

interface ConversationsListProps {
  selectedConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
  onNewChat: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  selectedConversationId,
  onConversationSelect,
  onNewChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Konuşmaları getir
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationService.getConversations,
    refetchInterval: 5000 // Her 5 saniyede bir güncelle
  });



  // Filtrelenmiş konuşmalar
  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participants.some(p => 
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes}dk`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}sa`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}g`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getConversationTitle = (conversation: Conversation, currentUserId?: number) => {
    if (conversation.type === 'groupchat') {
      return conversation.title || 'Grup Sohbeti';
    }

    // Direkt mesaj için diğer katılımcının adını göster
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.firstName && otherParticipant.lastName 
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : otherParticipant.username;
    }

    return 'Direkt Mesaj';
  };

  const getConversationAvatar = (conversation: Conversation, currentUserId?: number) => {
    if (conversation.type === 'groupchat') {
      return conversation.groupImageUrl || null;
    }

    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    return otherParticipant?.avatarUrl || null;
  };

  const getAvatarInitials = (conversation: Conversation, currentUserId?: number) => {
    if (conversation.type === 'groupchat') {
      return conversation.title?.charAt(0).toUpperCase() || 'G';
    }

    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.firstName?.charAt(0).toUpperCase() || 
             otherParticipant.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const truncateMessage = (content?: string, maxLength: number = 50) => {
    if (!content) return 'Medya mesajı';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
      style={{ 
        height: 'calc(100vh - 4.1rem)', 
        minHeight: 'calc(100vh - 4.1rem)',
        maxHeight: 'calc(100vh - 4.1rem)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mesajlar</h2>
          <button
            onClick={onNewChat}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Yeni sohbet başlat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sohbetlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz mesajınız yok'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {searchQuery 
                ? 'Arama kriterlerinize uygun sohbet bulunamadı.'
                : 'Yeni bir sohbet başlatarak arkadaşlarınızla konuşmaya başlayın.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Yeni Sohbet Başlat
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const avatarUrl = getConversationAvatar(conversation, user?.id);
              const initials = getAvatarInitials(conversation, user?.id);
              const title = getConversationTitle(conversation, user?.id);

              return (
                <div
                  key={conversation.id}
                  onClick={async () => {
                    // Parent'a bildir
                    onConversationSelect(conversation.id);
                    
                    // Eğer okunmamış mesaj varsa cache'yi yenile
                    if (conversation.unreadCount > 0) {
                      // Biraz bekleyip cache'yi yenile (API çağrısının tamamlanması için)
                      setTimeout(() => {
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                      }, 100);
                    }
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {initials}
                          </span>
                        )}
                      </div>
                      
                      
                      {/* Group indicator */}
                      {conversation.type === 'groupchat' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                          <Users className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          {conversation.lastMessage && (
                            <>
                              <span>{formatLastMessageTime(conversation.lastMessage.createdAt)}</span>
                              {/* Message status - only for sent messages */}
                              <div className="ml-1">
                                <CheckCheck className="w-3 h-3 text-blue-500" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.lastMessage 
                            ? conversation.lastMessage.content 
                              ? truncateMessage(conversation.lastMessage.content)
                              : 'Medya mesajı'
                            : 'Yeni sohbet başlat'
                          }
                        </p>
                        
                        {/* Unread count */}
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Typing indicator */}
                      {/* {isTyping && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-blue-600 dark:text-blue-400">yazıyor...</span>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;