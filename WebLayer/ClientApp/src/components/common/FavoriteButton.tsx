import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Star, Bookmark } from 'lucide-react';
import { FavoriteType } from '../../types';
import { favoritesAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  entityType: 'game' | FavoriteType;
  entityId: number;
  variant?: 'heart' | 'star' | 'bookmark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  entityType,
  entityId,
  variant = 'heart',
  size = 'md',
  showText = false,
  className = ''
}) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Query key generator based on entity type
  const getQueryKey = () => {
    if (entityType === 'game') {
      return ['userGameStatus', user?.id, entityId];
    } else {
      return ['userFavorite', user?.id, entityType, entityId];
    }
  };

  // Fetch favorite status for all entity types using favorites API
  const { data: favoriteStatus } = useQuery({
    queryKey: ['userFavorite', user?.id, entityType, entityId],
    queryFn: async () => {
      if (!user) return false;
      
      try {
        // Map entity type to FavoriteType enum value
        const getFavoriteType = (entityType: string | FavoriteType): number => {
          if (entityType === 'game') return 1; // Game = 1
          if (typeof entityType === 'number') return entityType;
          return 1; // Default to Game
        };
        
        const result = await favoritesAPI.checkIfFavorited(getFavoriteType(entityType), entityId);
        return result.data || false;
      } catch (error: any) {
        // Return false for any error (404, 500, etc.)
        return false;
      }
    },
    enabled: !!user && !!isAuthenticated,
    staleTime: 30 * 1000,
    retry: false, // Don't retry on 404s
  });

  // Derive favorite status from query data instead of local state
  const isFavorited = !!favoriteStatus;

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Map entity type to FavoriteType enum value
      const getFavoriteType = (entityType: string | FavoriteType): number => {
        if (entityType === 'game') return 1; // Game = 1
        if (typeof entityType === 'number') return entityType;
        // Add other mappings as needed
        return 1; // Default to Game
      };
      
      // Use favorites API for all entity types including games
      return favoritesAPI.toggle({
        favoriteType: getFavoriteType(entityType),
        targetEntityId: entityId
      });
    },
    onSuccess: (result) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['userFavorite', user?.id, entityType, entityId] });
      
      // Show specific success message based on action
      if (isFavorited) {
        toast.success('🗑️ Favorilerden kaldırıldı');
      } else {
        toast.success('⭐ Favorilere eklendi!');
      }
    },
    onError: (error) => {
      console.error('Toggle favorite error:', error);
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  const handleToggle = () => {
    if (!isAuthenticated) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }
    
    toggleFavoriteMutation.mutate();
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

  // Icon selection
  const getIcon = () => {
    const iconClass = `${iconSizeClasses[size]} transition-all duration-200`;
    
    switch (variant) {
      case 'star':
        return <Star className={`${iconClass} ${isFavorited ? 'fill-current' : ''}`} />;
      case 'bookmark':
        return <Bookmark className={`${iconClass} ${isFavorited ? 'fill-current' : ''}`} />;
      default:
        return <Heart className={`${iconClass} ${isFavorited ? 'fill-current' : ''}`} />;
    }
  };

  // Color classes based on variant and state
  const getColorClasses = () => {
    if (isFavorited) {
      switch (variant) {
        case 'star':
          return 'text-white bg-yellow-500 shadow-lg';
        case 'bookmark':
          return 'text-white bg-purple-600 shadow-lg border-0 hover:bg-purple-700 transform hover:scale-105';
        default:
          return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      }
    } else {
      switch (variant) {
        case 'star':
          return 'text-gray-600 dark:text-gray-400 hover:bg-yellow-500 hover:text-white border border-yellow-500';
        case 'bookmark':
          return 'bg-purple-500 text-white hover:bg-purple-600 border-0 shadow-md hover:shadow-lg transform hover:scale-105';
        default:
          return 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20';
      }
    }
  };

  // Text labels
  const getText = () => {
    if (!showText) return null;
    
    const baseText = entityType === 'game' ? 'Favori' : 'Favorile';
    return isFavorited ? `${baseText}lerden Çıkar` : `${baseText}lere Ekle`;
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggleFavoriteMutation.isLoading}
      className={`inline-flex items-center gap-2 transition-all duration-200 disabled:opacity-50 rounded-lg ${
        paddingClasses[size]
      } ${sizeClasses[size]} ${getColorClasses()} ${className}`}
      title={isFavorited ? 'Favorilerden kaldır' : 'Favorilere ekle'}
    >
      {getIcon()}
      {showText && <span>{getText()}</span>}
    </button>
  );
};

export default FavoriteButton;