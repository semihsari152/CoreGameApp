import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, ThumbsDown, Heart } from 'lucide-react';
import { LikableType, Like } from '../../types';
import { likesAPI, commentsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface ToggleLikeResponse {
  message: string;
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface LikeButtonProps {
  entityType: LikableType;
  entityId: number;
  variant?: 'default' | 'heart' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  entityType,
  entityId,
  variant = 'default',
  size = 'md',
  showCounts = true,
  className = ''
}) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch like stats
  const { data: likeStats = { likeCount: 0, dislikeCount: 0, totalCount: 0, likePercentage: 0 } } = useQuery({
    queryKey: ['likeStats', entityType, entityId],
    queryFn: async () => {
      try {
        const stats = await likesAPI.getLikeStats(entityType, entityId);
        return stats || { likeCount: 0, dislikeCount: 0, totalCount: 0, likePercentage: 0 };
      } catch (error) {
        // Return default stats if error occurs - completely silent
        return { likeCount: 0, dislikeCount: 0, totalCount: 0, likePercentage: 0 };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch user's like status - API çağrısı yapacak ama sessizce
  const { data: userLike } = useQuery<Like | null>({
    queryKey: ['userLike', entityType, entityId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await likesAPI.getUserLike(user.id, entityType, entityId);
        return response || null;
      } catch (error: any) {
        // 404 = kullanıcı beğenmemiş, sessizce null döndür
        return null;
      }
    },
    enabled: !!user?.id && !!isAuthenticated, // Giriş yapmış kullanıcılar için çalışsın
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    retry: false, // Hata durumunda tekrar deneme
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Mount olduğunda bir kez çek
    refetchOnReconnect: false,
  });

  // Derive state from queries instead of local state  
  const userLikeStatus: 'like' | 'dislike' | 'none' = 
    userLike?.isLike === true ? 'like' : 
    userLike?.isLike === false ? 'dislike' : 
    'none';
  const likeCount = likeStats.likeCount;
  const dislikeCount = likeStats.dislikeCount;

  // Sadece cache'den oku - API çağrısı yok, 404 yok
  // İlk yüklemede beğeni durumu bilinmiyor (gri), toggle sonrası bilinir hale gelir

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ isLike }: { isLike: boolean }): Promise<ToggleLikeResponse> => {
      if (!user) throw new Error('User not authenticated');
      
      // Comment like için commentsAPI kullan
      if (entityType === LikableType.Comment) {
        return isLike ? commentsAPI.like(entityId) : commentsAPI.dislike(entityId);
      }
      
      // Diğer entity'ler için eski API kullan (response dönmüyor, mock response dön)
      await likesAPI.toggle(user.id, entityType, entityId, isLike);
      return { message: isLike ? 'Beğenildi' : 'Beğenilmedi', isLiked: isLike ? true : undefined, isDisliked: isLike ? undefined : true };
    },
    onSuccess: (response: ToggleLikeResponse, variables: { isLike: boolean }) => {
      // Önce like stats'ı invalidate et
      queryClient.invalidateQueries({ queryKey: ['likeStats', entityType, entityId] });
      
      // Backend response'a göre cache'i güncelle
      if (user?.id) {
        // Eğer backend false döndüyse (toggle off), cache'i null yap
        // Eğer backend true döndüyse (toggle on), cache'e like objesi koy
        if (response?.isLiked === true || response?.isDisliked === true) {
          const newUserLike = { 
            id: Date.now(), // Fake ID
            userId: user.id, 
            isLike: response.isLiked === true, // response'a göre set et
            likableType: entityType,
            targetEntityId: entityId,
            createdDate: new Date().toISOString()
          };
          queryClient.setQueryData(['userLike', entityType, entityId, user.id], newUserLike);
        } else {
          // Toggle off - cache'i temizle
          queryClient.setQueryData(['userLike', entityType, entityId, user.id], null);
        }
      }
      
      toast.success(response?.message || 'İşlem başarılı');
    },
    onError: (error) => {
      console.error('Toggle like error:', error);
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    // Her durumda backend API'sine çağrı yap - backend toggle davranış yapıyor
    toggleLikeMutation.mutate({ isLike: true });
  };

  const handleDislike = () => {
    if (!isAuthenticated) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    // Her durumda backend API'sine çağrı yap - backend toggle davranış yapıyor
    toggleLikeMutation.mutate({ isLike: false });
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const paddingClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2'
  };

  if (variant === 'heart') {
    const isLiked = userLikeStatus === 'like';
    return (
      <button
        onClick={handleLike}
        disabled={toggleLikeMutation.isPending}
        className={`inline-flex items-center gap-2 transition-all duration-200 disabled:opacity-50 rounded-lg ${
          paddingClasses[size]
        } ${sizeClasses[size]} ${
          isLiked
            ? 'bg-red-600 text-white shadow-lg border-0 hover:bg-red-700 transform hover:scale-105'
            : 'bg-red-500 text-white hover:bg-red-600 border-0 shadow-md hover:shadow-lg transform hover:scale-105'
        } ${className}`}
      >
        <Heart 
          className={`${iconSizeClasses[size]} transition-all duration-200 ${isLiked ? 'fill-current animate-pulse' : ''}`} 
        />
        {showCounts && <span className="font-medium">{likeCount}</span>}
      </button>
    );
  }

  if (variant === 'compact') {
    const netScore = likeCount - dislikeCount;
    return (
      <div className={`inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full ${className}`}>
        <button
          onClick={handleLike}
          disabled={toggleLikeMutation.isPending}
          className={`inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
            paddingClasses[size]
          } ${sizeClasses[size]} rounded-l-full ${
            userLikeStatus === 'like'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          <ThumbsUp className={iconSizeClasses[size]} />
        </button>
        
        {showCounts && (
          <span className={`px-2 text-center min-w-[2rem] ${sizeClasses[size]} ${
            netScore > 0 ? 'text-green-600 dark:text-green-400' : 
            netScore < 0 ? 'text-red-600 dark:text-red-400' : 
            'text-gray-700 dark:text-gray-300'
          }`}>
            {netScore > 0 ? `+${netScore}` : netScore}
          </span>
        )}

        <button
          onClick={handleDislike}
          disabled={toggleLikeMutation.isPending}
          className={`inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
            paddingClasses[size]
          } ${sizeClasses[size]} rounded-r-full ${
            userLikeStatus === 'dislike'
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          <ThumbsDown className={iconSizeClasses[size]} />
        </button>
      </div>
    );
  }

  // Default variant with separate like/dislike buttons
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <button
        onClick={handleLike}
        disabled={toggleLikeMutation.isPending}
        className={`inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
          paddingClasses[size]
        } ${sizeClasses[size]} rounded-lg ${
          userLikeStatus === 'like'
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
            : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        }`}
      >
        <ThumbsUp className={iconSizeClasses[size]} />
        {showCounts && <span>{likeCount}</span>}
      </button>

      <button
        onClick={handleDislike}
        disabled={toggleLikeMutation.isPending}
        className={`inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
          paddingClasses[size]
        } ${sizeClasses[size]} rounded-lg ${
          userLikeStatus === 'dislike'
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500'
            : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
      >
        <ThumbsDown className={iconSizeClasses[size]} />
        {showCounts && <span>{dislikeCount}</span>}
      </button>
    </div>
  );
};

export default LikeButton;