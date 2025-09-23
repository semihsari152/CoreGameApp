import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video, 
  Reply,
  Image,
  Link,
  X,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import { chatSignalRService } from '../../services/chatSignalRService';
import { Conversation, Message } from '../../types/messaging';
import { formatLastSeen } from '../../utils/dateUtils';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import MediaPreview from './MediaPreview';
import GroupInfoModal from './GroupInfoModal';
import UserInfoModal from './UserInfoModal';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  conversationId: number;
  currentUserId: number;
  onBackClick?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, currentUserId, onBackClick }) => {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Konuşma ve mesajları getir
  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationService.getConversation(conversationId),
    enabled: !!conversationId
  });

  // SignalR bağlantısını kur
  useEffect(() => {
    const initSignalR = async () => {
      try {
        await chatSignalRService.connect();
        await chatSignalRService.joinConversation(conversationId);

        // Event handlers
        chatSignalRService.setOnMessageReceived((message) => {
          if (message.conversationId === conversationId) {
            queryClient.setQueryData(['conversation', conversationId], (old: Conversation | undefined) => {
              if (!old) return old;
              return {
                ...old,
                messages: [...(old.messages || []), message].sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
              };
            });
            // Auto scroll to bottom when receiving new message
            setTimeout(scrollToBottom, 100);
          }
        });

        chatSignalRService.setOnUserTyping((indicator) => {
          if (indicator.conversationId === conversationId && indicator.userId !== currentUserId) {
            setTypingUsers(prev => {
              if (!prev.includes(indicator.username)) {
                return [...prev, indicator.username];
              }
              return prev;
            });
          }
        });

        chatSignalRService.setOnUserStoppedTyping((indicator) => {
          if (indicator.conversationId === conversationId) {
            setTypingUsers(prev => prev.filter(username => username !== indicator.username));
          }
        });

        chatSignalRService.setOnReactionUpdate((event) => {
          queryClient.setQueryData(['conversation', conversationId], (old: Conversation | undefined) => {
            if (!old?.messages) return old;
            
            return {
              ...old,
              messages: old.messages.map(msg => 
                msg.id === event.messageId 
                  ? { ...msg, reactions: event.reactions }
                  : msg
              )
            };
          });
        });

        chatSignalRService.setOnMessageError((error) => {
          console.log('Message error in ChatWindow:', error);
          // Error toast already shown in chatSignalRService
        });


      } catch (error) {
        console.error('SignalR connection failed:', error);
        toast.error('Bağlantı kurulamadı');
      }
    };

    if (conversationId) {
      initSignalR();
      
      // Mark conversation messages as read when opening the conversation
      const markAsRead = async () => {
        try {
          await conversationService.markConversationAsRead(conversationId);
          // Refresh conversations list to update unread counts
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.refetchQueries({ queryKey: ['conversations'] });
          console.log('Messages marked as read for conversation:', conversationId);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };
      
      // Mark as read after a short delay to ensure messages are loaded
      const timeoutId = setTimeout(markAsRead, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        chatSignalRService.leaveConversation(conversationId);
      };
    }

    return () => {
      // Empty cleanup if no conversation
    };
  }, [conversationId, currentUserId, queryClient]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Auto scroll to bottom when messages change (new messages received)
  useEffect(() => {
    if (conversation?.messages && conversation.messages.length > 0) {
      scrollToBottom();
    }
  }, [conversation?.messages]);

  // Auto scroll to bottom when conversation changes (switching conversations)
  useEffect(() => {
    if (conversationId && conversation) {
      scrollToBottom();
    }
  }, [conversationId, conversation]);

  // Close options menu when clicking outside

  // Typing indicator
  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      await chatSignalRService.sendTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await chatSignalRService.stopTyping(conversationId);
    }, 1500);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Send message
  const sendMessage = async () => {
    console.log('SendMessage function called');
    console.log('messageText:', messageText);
    console.log('conversationId:', conversationId);
    
    if ((!messageText.trim() && !mediaUrl.trim()) || !conversationId) {
      console.log('SendMessage early return - no content or conversationId');
      return;
    }

    try {
      const content = messageText.trim() || undefined;
      const media = mediaUrl.trim() || undefined;
      const mediaType = media ? getMediaType(media) : undefined;

      console.log('Calling chatSignalRService.sendMessage with:', {
        conversationId,
        content,
        media,
        mediaType,
        replyToMessageId: replyToMessage?.id
      });

      await chatSignalRService.sendMessage(
        conversationId,
        content,
        media,
        mediaType,
        replyToMessage?.id
      );

      // Clear inputs
      setMessageText('');
      setMediaUrl('');
      setReplyToMessage(null);
      setShowMediaInput(false);
      setShowEmojiPicker(false);

      // Stop typing
      if (isTyping) {
        setIsTyping(false);
        await chatSignalRService.stopTyping(conversationId);
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Focus back to input
      messageInputRef.current?.focus();

      // Auto scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);

    } catch (error) {
      console.error('Send message failed:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  const getMediaType = (url: string): string => {
    const lower = url.toLowerCase();
    if (lower.includes('gif') || lower.endsWith('.gif')) return 'image/gif';
    if (lower.match(/\.(jpg|jpeg|png|webp)$/)) return 'image/jpeg';
    if (lower.match(/\.(mp4|mov|avi)$/)) return 'video/mp4';
    return 'link';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const text = e.dataTransfer.getData('text/plain');
    const url = e.dataTransfer.getData('text/uri-list');
    
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setMediaUrl(url);
      setShowMediaInput(true);
    } else if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      setMediaUrl(text);
      setShowMediaInput(true);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      // Auto-detect media URLs in paste
      if (text.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|svg)$/i) || 
          text.includes('youtube.com') || text.includes('youtu.be') ||
          text.includes('giphy.com') || text.includes('tenor.com') ||
          text.includes('imgur.com')) {
        e.preventDefault();
        setMediaUrl(text);
        setShowMediaInput(true);
      }
    }
  };



  const handleDeleteMessage = async (messageId: number) => {
    try {
      // Gerçek API çağrısı yap
      await conversationService.deleteMessage(messageId);
      
      // UI'dan mesajı kaldır
      queryClient.setQueryData(['conversation', conversationId], (old: Conversation | undefined) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages?.filter(m => m.id !== messageId) || []
        };
      });
      
      toast.success('Mesaj silindi');
    } catch (error) {
      console.error('Delete message failed:', error);
      toast.error('Mesaj silinemedi');
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return '';
    
    if (conversation.type === 'groupchat') {
      return conversation.title || 'Grup Sohbeti';
    }

    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.firstName && otherParticipant.lastName 
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : otherParticipant.username;
    }

    return 'Direkt Mesaj';
  };


  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Mesajlaşmaya başlayın
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Soldan bir sohbet seçin veya yeni bir sohbet başlatın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden relative ${
        isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      style={{ 
        height: 'calc(100vh - 4.1rem)', 
        minHeight: 'calc(100vh - 4.1rem)',
        maxHeight: 'calc(100vh - 4.1rem)'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            <button 
              onClick={onBackClick}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => {
                  if (conversation?.type === 'directmessage') {
                    setShowUserInfo(true);
                  } else if (conversation?.type === 'groupchat') {
                    setShowGroupInfo(true);
                  }
                }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                title={conversation?.type === 'groupchat' ? 'Grup bilgilerini görüntüle' : 'Profili görüntüle'}
              >
                {conversation?.type === 'groupchat' && conversation?.groupImageUrl ? (
                  <img
                    src={conversation.groupImageUrl}
                    alt={conversation.title}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentNode;
                      if (parent) {
                        const span = document.createElement('span');
                        span.className = 'text-white font-semibold';
                        span.textContent = getConversationTitle().charAt(0).toUpperCase();
                        parent.appendChild(span);
                      }
                    }}
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {getConversationTitle().charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {getConversationTitle()}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {conversation.type === 'groupchat' 
                  ? `${conversation.participants.length} üye`
                  : (() => {
                      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
                      if (otherParticipant) {
                        return `@${otherParticipant.username}`;
                      }
                      return 'Direkt Mesaj';
                    })()
                }
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Messages - Takes remaining space */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900" 
        style={{ 
          scrollBehavior: 'smooth'
        }}
      >
        {conversation.messages?.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender.id === currentUserId}
            onReply={setReplyToMessage}
            onReaction={(messageId, emoji) => chatSignalRService.toggleReaction(messageId, emoji)}
            onDelete={handleDeleteMessage}
          />
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} yazıyor...`
                : `${typingUsers.length} kişi yazıyor...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview - Above message input */}
      {replyToMessage && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 mx-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {replyToMessage.sender.username} yanıtlanıyor
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {replyToMessage.content || 'Medya mesajı'}
              </p>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Media preview - Above message input */}
      {showMediaInput && (
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mx-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Resim, GIF veya link URL'si yapıştırın..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowMediaInput(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Quick media service buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center w-full mb-1">
              <span>Desteklenen popüler servisler:</span>
            </div>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs">
              🎭 GIPHY
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">
              🎪 Tenor
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs">
              🖼️ Imgur
            </span>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
              ▶️ YouTube
            </span>
            <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full text-xs">
              🌐 Web Links
            </span>
          </div>

          {/* Helper text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            <p>💡 Desteklenen formatlar: .jpg, .png, .gif, .webp, .mp4, .webm ve çoğu link</p>
          </div>

          {mediaUrl && (
            <MediaPreview url={mediaUrl} onRemove={() => setMediaUrl('')} />
          )}
        </div>
      )}

      {/* Emoji Picker - Floating above input */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-50">
          <EmojiPicker
            onEmojiSelect={addEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Message Input - At bottom */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`p-2 transition-colors rounded-lg ${
                showMediaInput 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="URL ile medya ekle"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 transition-colors rounded-lg ${
                  showEmojiPicker 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-3">
            <textarea
              ref={messageInputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Mesajınızı yazın veya medya URL'si yapıştırın..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: 'auto'
              }}
            />
            
            <button
              onClick={sendMessage}
              disabled={!messageText.trim() && !mediaUrl.trim()}
              className={`p-3 rounded-xl transition-colors ${
                messageText.trim() || mediaUrl.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Paperclip className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Medya Paylaş
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Buraya bırakın: resim, GIF, video veya link URL'si
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Desteklenen: JPG, PNG, GIF, MP4, YouTube, Giphy, vb.
            </div>
          </div>
        </div>
      )}

      {/* Group Info Modal */}
      {conversation?.type === 'groupchat' && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversationId={conversationId}
        />
      )}

      {/* User Info Modal */}
      {conversation?.type === 'directmessage' && (
        <UserInfoModal
          isOpen={showUserInfo}
          onClose={() => setShowUserInfo(false)}
          conversationId={conversationId}
        />
      )}
    </div>
  );
};

export default ChatWindow;