import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Calendar, 
  Users, 
  Gamepad2,
  Heart,
  Share,
  Download,
  Play,
  MessageSquare,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Tag,
  Trophy,
  PenTool,
  Image,
  Settings,
  Monitor,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { Game, Comment } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { SteamInspiredLayout } from './GameDetailLayouts';

const GameDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'comments' | 'guides' | 'blogs' | 'forum' | 'screenshots'>('overview');
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);

  // Fetch game details with optimized timeout
  const { data: game, isLoading } = useQuery({
    queryKey: ['game', slug],
    queryFn: () => {
      if (!slug) throw new Error('No slug provided');
      return api.games.getBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch game comments
  const { data: comments } = useQuery({
    queryKey: ['game-comments', game?.id],
    queryFn: () => api.comments.getByEntityId('Game', game!.id),
    enabled: !!game?.id
  });

  // Fetch guides for this game
  const { data: guidesResponse } = useQuery({
    queryKey: ['game-guides', game?.id],
    queryFn: () => api.guides.getAll({ gameId: game!.id, pageSize: 10 }),
    enabled: !!game?.id
  });

  // Fetch blogs related to this game
  const { data: blogsResponse } = useQuery({
    queryKey: ['game-blogs', game?.id],
    queryFn: () => api.blogs.getAll({ gameId: game!.id, pageSize: 10 }),
    enabled: !!game?.id
  });

  // Fetch forum posts related to this game
  const { data: forumResponse } = useQuery({
    queryKey: ['game-forum', game?.id],
    queryFn: () => api.forum.getTopics({ gameId: game!.id, pageSize: 10 }),
    enabled: !!game?.id
  });

  // Fetch similar games
  const { data: similarGamesData } = useQuery({
    queryKey: ['similar-games', game?.id],
    queryFn: () => api.games.getSimilar(game!.id, 10),
    enabled: !!game?.id
  });

  // Fetch user's current rating for this game
  const { data: userGameRating } = useQuery({
    queryKey: ['user-game-rating', user?.id, game?.id],
    queryFn: async () => {
      try {
        if (!game?.id) return null;
        return await api.gameRatings.getUserRating(game.id);
      } catch (error: any) {
        // Always return null for any error - user not rating a game is completely normal
        // Don't throw errors or show toast messages for rating queries
        return null;
      }
    },
    enabled: !!game?.id && !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry on any error
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  // Fetch rating distribution for this game
  const { data: ratingDistribution } = useQuery({
    queryKey: ['rating-distribution', game?.id],
    queryFn: async () => {
      try {
        if (!game?.id) return null;
        return await api.gameRatings.getRatingDistribution(game.id);
      } catch (error) {
        return null;
      }
    },
    enabled: !!game?.id,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Check if game is favorited by current user
  const { data: isFavorited } = useQuery({
    queryKey: ['user-game-favorite', user?.id, game?.id],
    queryFn: async () => {
      try {
        const response = await api.favorites.checkIfFavorited(1, game!.id); // 1 = Game type
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!game?.id && !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });


  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: () => api.favorites.toggle({
      favoriteType: 1, // Game type = 1 based on FavoriteType enum
      targetEntityId: game!.id
    }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries(['game', slug]);
      queryClient.invalidateQueries(['user-game-favorite', user?.id, game?.id]);
    },
    onError: () => {
      toast.error('Bir hata oluştu');
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.comments.create({
      entityType: 'Game',
      entityId: game!.id,
      content
    }),
    onSuccess: () => {
      toast.success('Yorumunuz eklendi!');
      setNewComment('');
      queryClient.invalidateQueries(['game-comments', game?.id]);
    },
    onError: () => {
      toast.error('Yorum eklenirken bir hata oluştu');
    }
  });

  // Rate game mutation
  const rateGameMutation = useMutation({
    mutationFn: (rating: number) => {
      const gameId = game?.id;
      if (!gameId) throw new Error('Game ID not found');
      return api.gameRatings.rateGame(gameId, rating);
    },
    onSuccess: () => {
      toast.success('Puanınız kaydedildi!');
      // Invalidate all relevant queries
      const gameId = game?.id;
      queryClient.invalidateQueries({ queryKey: ['game', slug] });
      queryClient.invalidateQueries({ queryKey: ['user-game-rating', user?.id, gameId] });
      queryClient.invalidateQueries({ queryKey: ['rating-distribution', gameId] });
    },
    onError: () => {
      toast.error('Puanlama sırasında bir hata oluştu');
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleAddToFavorites = () => {
    if (!isAuthenticated) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }
    addToFavoritesMutation.mutate();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const handleRating = (rating: number) => {
    if (!isAuthenticated) {
      toast.error('Puanlama için giriş yapmalısınız');
      return;
    }
    setUserRating(rating);
    rateGameMutation.mutate(rating);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-300">Loading Game Details...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">This might take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Game Not Found
          </h2>
          <p className="text-gray-700 dark:text-gray-400">
            The game you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Combine game data with guides, blogs, and forum posts
  const gameWithRelatedData = {
    ...game,
    guides: guidesResponse?.data || [],
    blogPosts: blogsResponse?.data || [],
    forumPosts: forumResponse?.data || []
  };

  return (
    <SteamInspiredLayout
      game={gameWithRelatedData}
      onAddToFavorites={handleAddToFavorites}
      onRating={handleRating}
      isAuthenticated={isAuthenticated}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      formatDate={formatDate}
      similarGames={similarGamesData || []}
      userRating={userGameRating?.rating || 0}
      ratingDistribution={ratingDistribution}
      isFavorited={isFavorited || false}
    />
  );
};

export default GameDetailPage;