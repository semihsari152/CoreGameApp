import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ConversationsList from '../components/chat/ConversationsList';
import ChatWindow from '../components/chat/ChatWindow';
import FriendsList from '../components/social/FriendsList';
import FriendSearchModal from '../components/Friends/FriendSearchModal';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import { MessageSquare, Users, X, Settings } from 'lucide-react';
import { conversationService } from '../services/conversationService';
import { chatSignalRService } from '../services/chatSignalRService';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>();
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;
      
      try {
        setIsConnecting(true);
        await chatSignalRService.connect();
        console.log('Chat connected successfully');
      } catch (error) {
        console.error('Chat connection failed:', error);
        toast.error('Chat bağlantısı kurulamadı');
      } finally {
        setIsConnecting(false);
      }
    };

    initializeChat();

    return () => {
      // Cleanup will be handled by useAuth hook
    };
  }, [user]);

  // Handle direct user chat from URL parameter
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && user) {
      const handleDirectChat = async () => {
        try {
          // Try to find existing conversation with this user
          const conversations = await conversationService.getConversations();
          const existingConversation = conversations.find((conv: any) => 
            conv.type === 'directmessage' && 
            conv.participants.some((p: any) => p.id === parseInt(userId))
          );

          if (existingConversation) {
            setSelectedConversationId(existingConversation.id);
          } else {
            // Create new direct message conversation
            const newConversation = await conversationService.createDirectConversation(parseInt(userId));
            setSelectedConversationId(newConversation.id);
            toast.success('Yeni sohbet başlatıldı');
          }
        } catch (error) {
          console.error('Failed to start direct chat:', error);
          toast.error('Sohbet başlatılamadı');
        }
      };

      handleDirectChat();
    }
  }, [searchParams, user]);

  // Handle direct conversation from URL parameter  
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && user) {
      const conversationIdInt = parseInt(conversationId);
      if (!isNaN(conversationIdInt)) {
        setSelectedConversationId(conversationIdInt);
        
        // Clear the URL parameter to clean up the URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('conversation');
        navigate(`/chat?${newSearchParams.toString()}`, { replace: true });
        
        // Mark conversation as read
        conversationService.markConversationAsRead(conversationIdInt).catch(error => {
          console.error('Failed to mark conversation as read:', error);
        });
      }
    }
  }, [searchParams, user, navigate]);

  const handleConversationSelect = async (conversationId: number) => {
    setSelectedConversationId(conversationId);
    
    // Konuşmadaki okunmamış mesajları işaretle
    try {
      await conversationService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const handleNewChat = () => {
    setShowFriendsList(true);
  };

  const handleStartChat = async (friendId: number) => {
    try {
      const conversation = await conversationService.createDirectConversation(friendId);
      setSelectedConversationId(conversation.id);
      setShowFriendsList(false);
      setShowFriendSearch(false);
      toast.success('Yeni sohbet başlatıldı');
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Sohbet başlatılamadı');
    }
  };

  const handleGroupCreated = async (conversationId: number) => {
    try {
      setSelectedConversationId(conversationId);
      // Refresh conversations list by triggering a re-render
      // The ConversationsList component should automatically update
    } catch (error) {
      console.error('Failed to select new group:', error);
    }
  };

  const handleBackClick = () => {
    setSelectedConversationId(undefined);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Oturum açın
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Mesajlaşmaya başlamak için lütfen oturum açın.
          </p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Chat'e bağlanılıyor...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Lütfen bekleyin, chat servisi başlatılıyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .chat-grid {
          height: calc(100vh - 4.1rem);
          display: grid;
          grid-template-columns: ${selectedConversationId ? 'auto 1fr' : '1fr'};
          grid-template-rows: 1fr;
          overflow: hidden;
        }
        @media (max-width: 1024px) {
          .chat-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="bg-gray-50 dark:bg-gray-900 chat-grid">
      {/* Conversations Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${selectedConversationId ? 'hidden lg:block' : 'block'} h-full`}>
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col h-full overflow-hidden">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.id}
            onBackClick={handleBackClick}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Mesajlaşmaya başlayın
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Soldan bir sohbet seçin veya arkadaşlarınızla yeni bir sohbet başlatın.
              </p>
              <button
                onClick={handleNewChat}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Users className="w-5 h-5" />
                Yeni Sohbet Başlat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Modals */}
    {showFriendsList && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 max-h-[80vh] flex flex-col">
          {/* Modal Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Arkadaşlarınız
              </h3>
              <button
                onClick={() => setShowFriendsList(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowFriendsList(false);
                  setShowCreateGroup(true);
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Grup Sohbeti Oluştur
              </button>
              
              <button
                onClick={() => {
                  setShowFriendsList(false);
                  setShowFriendSearch(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Yeni Arkadaş Ara
              </button>
              
              <button
                onClick={() => {
                  setShowFriendsList(false);
                  navigate('/friends');
                }}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Arkadaşlık İşlemleri
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-hidden">
            <FriendsList
              onStartChat={handleStartChat}
              showChatButtons={true}
              compact={true}
            />
          </div>
        </div>
      </div>
    )}

    {/* Friend Search Modal */}
    <FriendSearchModal
      isOpen={showFriendSearch}
      onClose={() => setShowFriendSearch(false)}
      onStartChat={handleStartChat}
    />

    {/* Create Group Modal */}
    <CreateGroupModal
      isOpen={showCreateGroup}
      onClose={() => setShowCreateGroup(false)}
      onGroupCreated={handleGroupCreated}
    />

    {/* Connection Status Indicator */}
    <div className="fixed bottom-4 left-4 z-40">
      <div className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
        chatSignalRService.isConnected()
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          chatSignalRService.isConnected() ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        {chatSignalRService.isConnected() ? 'Bağlı' : 'Bağlantı Yok'}
      </div>
    </div>
    </>
  );
};

export default ChatPage;