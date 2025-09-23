import { useQuery } from '@tanstack/react-query';
import { conversationService } from '../services/conversationService';
import { useAuth } from './useAuth';

export const useUnreadMessages = () => {
  const { isAuthenticated } = useAuth();
  
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationService.getConversations,
    refetchInterval: 2000, // Daha sık yenile
    refetchOnWindowFocus: true, // Pencere focus olduğunda yenile
    staleTime: 0, // Cache'i hemen stale yap
    enabled: isAuthenticated
  });

  const unreadCount = conversations.reduce((total, conversation) => {
    return total + (conversation.unreadCount || 0);
  }, 0);

  return {
    unreadCount: isAuthenticated ? unreadCount : 0,
    conversations: isAuthenticated ? conversations : []
  };
};