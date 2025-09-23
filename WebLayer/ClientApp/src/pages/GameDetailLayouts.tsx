import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Calendar, 
  Users, 
  Gamepad2,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Play,
  List,
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
  Clock,
  Globe,
  Zap,
  Award,
  Eye,
  Monitor,
  Video,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  ArrowRight,
  Hash,
  MessageCircle
} from 'lucide-react';
import { Game, CommentableType, LikableType, GameListType, UserGameStatus, CreateUserGameStatusDto, UpdateUserGameStatusDto } from '../types';
import { gamesAPI, apiService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import CommentSection from '../components/comments/CommentSection';
import LikeButton from '../components/common/LikeButton';
import FavoriteButton from '../components/common/FavoriteButton';
import toast from 'react-hot-toast';

interface GameDetailLayoutProps {
  game: Game;
  onAddToFavorites: () => void;
  onRating: (rating: number) => void;
  isAuthenticated: boolean;
  activeTab: 'overview' | 'reviews' | 'comments' | 'guides' | 'blogs' | 'forum' | 'screenshots';
  setActiveTab: React.Dispatch<React.SetStateAction<'overview' | 'reviews' | 'comments' | 'guides' | 'blogs' | 'forum' | 'screenshots'>>;
  formatDate: (date: string) => string;
  similarGames?: Game[];
  userRating?: number;
  ratingDistribution?: any;
  isFavorited?: boolean;
}

// Steam-inspired Layout
export const SteamInspiredLayout: React.FC<GameDetailLayoutProps> = ({
  game,
  onAddToFavorites,
  onRating,
  isAuthenticated,
  activeTab,
  setActiveTab,
  formatDate,
  similarGames: propSimilarGames,
  userRating: propUserRating,
  ratingDistribution,
  isFavorited
}) => {
  const [userRating, setUserRating] = useState(propUserRating || 0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [similarGamesPage, setSimilarGamesPage] = useState(0);
  const [similarGames, setSimilarGames] = useState<any[]>([]);

  // Update local userRating when propUserRating changes
  useEffect(() => {
    setUserRating(propUserRating || 0);
  }, [propUserRating]);
  
  // Game Status Dropdown
  const [showGameStatusDropdown, setShowGameStatusDropdown] = useState(false);
  const [currentGameStatus, setCurrentGameStatus] = useState<string | null>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<Array<{url: string, title?: string}>>([]);

  // React Query hooks
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user's current game status - API çağrısı yapacak ama sessizce
  const { data: userGameStatus } = useQuery({
    queryKey: ['userGameStatus', user?.id, game.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await apiService.userGameStatus.getUserGameStatus(user.id, game.id);
        return response || null;
      } catch (error: any) {
        // 404 = kullanıcı oyun durumu belirlememiş, sessizce null döndür
        return null;
      }
    },
    enabled: !!user?.id, // Giriş yapmış kullanıcılar için çalışsın
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Mount olduğunda bir kez çek
    refetchOnReconnect: false,
  });

  // Create/Update game status mutation
  const gameStatusMutation = useMutation({
    mutationFn: async (status: GameListType) => {
      const dto: CreateUserGameStatusDto = {
        gameId: game.id,
        status: status
      };
      return apiService.userGameStatus.createOrUpdate(dto);
    },
    onSuccess: (result, variables) => {
      // Cache'i manuel olarak güncelle - hızlı UI response için
      if (user?.id && result) {
        queryClient.setQueryData(['userGameStatus', user.id, game.id], result);
      }
      
      // Sonra invalidate et ki server'dan fresh data gelsin
      queryClient.invalidateQueries(['userGameStatus', user?.id, game.id]);
      toast.success('Oyun durumu güncellendi!');
    },
    onError: () => {
      toast.error('Oyun durumu güncellenirken hata oluştu');
    }
  });

  // Remove game status mutation
  const removeStatusMutation = useMutation({
    mutationFn: () => apiService.userGameStatus.remove(game.id),
    onSuccess: () => {
      // Cache'i manuel olarak temizle
      if (user?.id) {
        queryClient.setQueryData(['userGameStatus', user.id, game.id], null);
      }
      
      queryClient.invalidateQueries(['userGameStatus', user?.id, game.id]);
      setCurrentGameStatus(null);
      toast.success('Oyun durumu kaldırıldı!');
    },
    onError: () => {
      toast.error('Oyun durumu kaldırılırken hata oluştu');
    }
  });

  const gamesPerPage = 5;
  const totalPages = Math.ceil(similarGames.length / gamesPerPage);
  const visibleSimilarGames = similarGames.slice(similarGamesPage * gamesPerPage, (similarGamesPage + 1) * gamesPerPage);

  const nextSimilarGamesPage = () => {
    if (similarGamesPage < totalPages - 1) {
      setSimilarGamesPage(similarGamesPage + 1);
    }
  };

  const prevSimilarGamesPage = () => {
    if (similarGamesPage > 0) {
      setSimilarGamesPage(similarGamesPage - 1);
    }
  };

  // Lightbox functions
  const openLightbox = (images: Array<{url: string, title?: string}>, index: number) => {
    setLightboxImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentImageIndex(0);
    setLightboxImages([]);
    document.body.style.overflow = 'unset';
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === lightboxImages.length - 1 ? 0 : prev + 1
    );
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? lightboxImages.length - 1 : prev - 1
    );
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      switch (event.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrevImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Use similar games from props
  useEffect(() => {
    if (propSimilarGames) {
      setSimilarGames(propSimilarGames);
    }
  }, [propSimilarGames]);

  // Update local user rating when prop changes
  useEffect(() => {
    if (propUserRating) {
      setUserRating(propUserRating);
    }
  }, [propUserRating]);

  // Update current game status when userGameStatus data changes
  useEffect(() => {
    if (userGameStatus) {
      const statusDisplayMap: Record<GameListType, string> = {
        [GameListType.Oynadim]: '✅ Oynadım',
        [GameListType.Oynamadim]: '❌ Oynamadım',
        [GameListType.Oynuyorum]: '🎮 Oynuyorum',
        [GameListType.Oynayacagim]: '⏳ Oynayacağım',
        [GameListType.Oynamam]: '🚫 Oynamam',
        [GameListType.Biraktim]: '📴 Bıraktım'
      };
      setCurrentGameStatus(statusDisplayMap[userGameStatus.status as GameListType] || null);
    } else {
      setCurrentGameStatus(null);
    }
  }, [userGameStatus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGameStatusDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.game-status-dropdown')) {
          setShowGameStatusDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGameStatusDropdown]);

  // Handle game status change
  const handleGameStatusChange = async (status: string | null) => {
    if (!isAuthenticated || !user) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    try {
      if (status) {
        // Convert string to GameListType enum
        const statusMap: Record<string, GameListType> = {
          'Oynadim': GameListType.Oynadim,
          'Oynamadim': GameListType.Oynamadim,
          'Oynuyorum': GameListType.Oynuyorum,
          'Oynayacagim': GameListType.Oynayacagim,
          'Oynamam': GameListType.Oynamam,
          'Biraktim': GameListType.Biraktim
        };

        const gameListStatus = statusMap[status];
        if (gameListStatus) {
          await gameStatusMutation.mutateAsync(gameListStatus);
          
          // Update display text
          const statusDisplayMap: Record<string, string> = {
            'Oynadim': '✅ Oynadım',
            'Oynamadim': '❌ Oynamadım',
            'Oynuyorum': '🎮 Oynuyorum',
            'Oynayacagim': '⏳ Oynayacağım',
            'Oynamam': '🚫 Oynamam',
            'Biraktim': '📴 Bıraktım'
          };
          setCurrentGameStatus(statusDisplayMap[status] || status);
        }
      } else {
        // Remove status
        await removeStatusMutation.mutateAsync();
      }
      
      setShowGameStatusDropdown(false);
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gamepad2 },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'screenshots', label: 'Media', icon: Image },
    { id: 'guides', label: 'Guides', icon: BookOpen },
    { id: 'blogs', label: 'Blogs', icon: PenTool },
    { id: 'forum', label: 'Forum', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Game Cover */}
            <div className="flex-shrink-0">
              <div className="w-64 aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
                {game.coverImageUrl ? (
                  <img src={game.coverImageUrl} alt={game.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <Gamepad2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Game Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{game.name}</h1>
                {game.description && (
                  <div className="text-xl text-gray-100 dark:text-gray-200 leading-relaxed mb-6">
                    <p>
                      {isDescriptionExpanded 
                        ? game.description 
                        : truncateText(game.description, 300)
                      }
                    </p>
                    {game.description.length > 300 && (
                      <button 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-blue-300 hover:text-blue-200 dark:text-blue-400 dark:hover:text-blue-300 mt-2 text-base font-medium transition-colors"
                      >
                        {isDescriptionExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/90 dark:bg-black/30 backdrop-blur-sm rounded-lg p-4 text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">User Reviews</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{game.averageRating?.toFixed(1) || 'N/A'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{game.totalReviews || 0} reviews</div>
                </div>

                <div className="bg-white/90 dark:bg-black/30 backdrop-blur-sm rounded-lg p-4 text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Release Date</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(game.releaseDate)}</div>
                </div>

                <div className="bg-white/90 dark:bg-black/30 backdrop-blur-sm rounded-lg p-4 text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Developer</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {game.developer || 'Unknown'}
                  </div>
                </div>
              </div>


              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {/* Watch Trailer - Only show if trailer exists */}
                {game.gameMedia && game.gameMedia.some(media => media.mediaType === 2) && (
                  <button 
                    onClick={() => {
                      const trailerVideo = game.gameMedia?.find(media => media.mediaType === 2);
                      if (trailerVideo) {
                        openLightbox([{url: trailerVideo.url, title: `${game.name} Trailer`}], 0);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold flex items-center space-x-3 transition-all duration-200 text-base text-white shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <Play className="w-5 h-5" />
                    <span>Trailer İzle</span>
                  </button>
                )}

                {/* Like Button */}
                <LikeButton
                  entityType={LikableType.Game}
                  entityId={game.id}
                  variant="heart"
                  size="lg"
                  showCounts={true}
                />
                
                {/* Game Status Dropdown */}
                <div className="relative game-status-dropdown">
                  <button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = '/login';
                        return;
                      }
                      setShowGameStatusDropdown(!showGameStatusDropdown);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center space-x-3 transition-colors text-base text-white w-full justify-center"
                  >
                    <List className="w-5 h-5" />
                    <span>{currentGameStatus || 'Oyun Durumu'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showGameStatusDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showGameStatusDropdown && isAuthenticated && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="py-2">
                        <button
                          onClick={() => handleGameStatusChange('Oynadim')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        >
                          ✅ Oynadım
                        </button>
                        <button
                          onClick={() => handleGameStatusChange('Oynamadim')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        >
                          ❌ Oynamadım
                        </button>
                        <button
                          onClick={() => handleGameStatusChange('Oynuyorum')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        >
                          🎮 Oynuyorum
                        </button>
                        <button
                          onClick={() => handleGameStatusChange('Oynayacagim')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        >
                          ⏳ Oynayacağım
                        </button>
                        <button
                          onClick={() => handleGameStatusChange('Oynamam')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        >
                          🚫 Oynamam
                        </button>
                        <button
                          onClick={() => handleGameStatusChange('Biraktim')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        >
                          📴 Bıraktım
                        </button>
                        {currentGameStatus && (
                          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                            <button
                              onClick={() => handleGameStatusChange(null)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            >
                              🗑️ Kaldır
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Add to Favorites */}
                <FavoriteButton 
                  entityType="game"
                  entityId={game.id}
                  variant="bookmark"
                  size="lg"
                  showText={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'reviews' | 'comments' | 'guides' | 'blogs' | 'forum' | 'screenshots')}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Storyline Section */}
                {game.storyline && game.storyline.trim() && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Storyline</h2>
                    <div className="text-gray-700 dark:text-gray-200">
                      <p className="leading-relaxed">{game.storyline}</p>
                    </div>
                  </div>
                )}

                {/* Game Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Game Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {game.genres && game.genres.length > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Genres</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.genres.map((genre) => (
                            <Link 
                              key={genre.id} 
                              to={`/games/genres/${genre.id}`}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-600/30 text-purple-800 dark:text-purple-200 rounded text-xs border border-purple-300 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-600/50 hover:text-purple-900 dark:hover:text-purple-100 transition-colors duration-200 cursor-pointer inline-block"
                            >
                              {genre.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {game.platforms && game.platforms.length > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Platforms</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.platforms.map((platform) => (
                            <Link 
                              key={platform.id} 
                              to={`/games/platforms/${platform.id}`}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-600/30 text-blue-800 dark:text-blue-200 rounded text-xs border border-blue-300 dark:border-blue-500/30 hover:bg-blue-200 dark:hover:bg-blue-600/50 hover:text-blue-900 dark:hover:text-blue-100 transition-colors duration-200 cursor-pointer inline-block"
                            >
                              {platform.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {game.themes && game.themes.length > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Themes</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.themes.map((theme) => (
                            <Link 
                              key={theme.id} 
                              to={`/games/themes/${theme.id}`}
                              className="px-2 py-1 bg-yellow-100 dark:bg-yellow-600/30 text-yellow-800 dark:text-yellow-200 rounded text-xs border border-yellow-300 dark:border-yellow-500/30 hover:bg-yellow-200 dark:hover:bg-yellow-600/50 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors duration-200 cursor-pointer inline-block"
                            >
                              {theme.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {game.gameModes && game.gameModes.length > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Game Modes</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.gameModes.map((mode) => (
                            <Link 
                              key={mode.id} 
                              to={`/games/game-modes/${mode.id}`}
                              className="px-2 py-1 bg-indigo-100 dark:bg-indigo-600/30 text-indigo-800 dark:text-indigo-200 rounded text-xs border border-indigo-300 dark:border-indigo-500/30 hover:bg-indigo-200 dark:hover:bg-indigo-600/50 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors duration-200 cursor-pointer inline-block"
                            >
                              {mode.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {game.playerPerspectives && game.playerPerspectives.length > 0 && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Perspectives</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.playerPerspectives.map((perspective) => (
                            <Link 
                              key={perspective.id} 
                              to={`/games/player-perspectives/${perspective.id}`}
                              className="px-2 py-1 bg-green-100 dark:bg-green-600/30 text-green-800 dark:text-green-200 rounded text-xs border border-green-300 dark:border-green-500/30 hover:bg-green-200 dark:hover:bg-green-600/50 hover:text-green-900 dark:hover:text-green-100 transition-colors duration-200 cursor-pointer inline-block"
                            >
                              {perspective.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Keywords */}
                {game.keywords && game.keywords.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {game.keywords.map((keyword) => (
                        <Link 
                          key={keyword.id} 
                          to={`/games/keywords/${keyword.id}`}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-200 rounded-full text-sm border border-blue-300 dark:border-blue-500/30 hover:bg-blue-200 dark:hover:bg-blue-600/40 hover:text-blue-900 dark:hover:text-blue-100 transition-colors duration-200 cursor-pointer inline-block"
                        >
                          {keyword.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'screenshots' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Media Gallery</h2>
                
                {/* Screenshots from GameMedia */}
                {game.gameMedia && game.gameMedia.filter(media => media.mediaType === 3 || media.mediaType === 1).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-700 dark:text-gray-300">
                      <Image className="w-5 h-5 mr-2" />
                      Screenshots ({game.gameMedia?.filter(media => media.mediaType === 3 || media.mediaType === 1).length || 0})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {game.gameMedia
                        ?.filter(media => media.mediaType === 3 || media.mediaType === 1)
                        .map((screenshot, index) => {
                          const filteredImages = game.gameMedia?.filter(media => media.mediaType === 3 || media.mediaType === 1) || [];
                          return (
                            <div 
                              key={screenshot.id || index} 
                              className="aspect-video rounded-lg overflow-hidden group cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200"
                              onClick={() => openLightbox(
                                filteredImages.map(img => ({ url: img.url, title: img.title || `${game.name} Screenshot` })), 
                                index
                              )}
                            >
                              <img 
                                src={screenshot.url} 
                                alt={screenshot.title || `${game.name} Screenshot ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Fallback: Screenshots from old format */}
                {(!game.gameMedia || game.gameMedia.filter(media => media.mediaType === 3 || media.mediaType === 1).length === 0) && 
                 game.screenshots && game.screenshots.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Image className="w-5 h-5 mr-2" />
                      Screenshots ({game.screenshots.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {game.screenshots.map((screenshot, index) => (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden group cursor-pointer">
                          <img 
                            src={screenshot} 
                            alt={`${game.name} Screenshot ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {game.videos && game.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      Videos ({game.videos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {game.videos.slice(0, 6).map((video, index) => (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <iframe
                            src={video.replace('watch?v=', 'embed/')}
                            title={`${game.name} Video ${index + 1}`}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Media Message */}
                {(!game.gameMedia || game.gameMedia.filter(media => media.mediaType === 3 || media.mediaType === 1).length === 0) && 
                 (!game.screenshots || game.screenshots.length === 0) && 
                 (!game.videos || game.videos.length === 0) && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Media Available</h3>
                    <p className="text-gray-400">No screenshots or videos have been added for this game yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
                
                {/* IGDB Ratings */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* IGDB User Rating */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-400" />
                      IGDB User Rating
                    </h3>
                    {game.igdbRating && game.igdbRating.userRating ? (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-400 mb-2">
                          {(game.igdbRating.userRating / 10).toFixed(1)}/10
                        </div>
                        <div className="flex justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round((game.igdbRating!.userRating! / 10) * 5)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-400">
                          {game.igdbRating.userRatingCount || 0} IGDB users rated
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <Star className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p>No IGDB user ratings yet</p>
                      </div>
                    )}
                  </div>

                  {/* IGDB Critics Rating */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      IGDB Critics Rating
                    </h3>
                    {game.igdbRating && game.igdbRating.criticRating ? (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-500 mb-2">
                          {(game.igdbRating.criticRating / 10).toFixed(1)}/10
                        </div>
                        <div className="flex justify-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round((game.igdbRating!.criticRating! / 10) * 5)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {game.igdbRating.criticRatingCount || 0} critics reviewed
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-600 dark:text-gray-400">
                        <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p>No critic reviews yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Our Platform Rating */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
                    <Star className="w-5 h-5 mr-2 text-green-400" />
                    Community Rating
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">
                        {game.averageRating?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="flex justify-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(game.averageRating || 0)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {game.totalReviews || 0} community reviews
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Rating Distribution</h4>
                      {[5, 4, 3, 2, 1].map((rating) => {
                        // Use game.ratingDistribution from backend
                        const ratingCount = game.ratingDistribution?.[rating] || 0;
                        const totalRatings = game.totalReviews || game.reviews?.length || 0;
                        const percentage = totalRatings > 0 ? (ratingCount / totalRatings) * 100 : 0;
                        
                        return (
                          <div key={rating} className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                              {rating}
                            </span>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                              {ratingCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                {game.reviews && game.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {game.reviews.map((review) => (
                      <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start space-x-4">
                          <Link 
                            to={`/profile/${review.user.username}`}
                            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium hover:opacity-80 transition-opacity overflow-hidden"
                          >
                            {review.user.avatarUrl ? (
                              <img 
                                src={review.user.avatarUrl} 
                                alt={review.user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-white font-medium">${review.user.username.charAt(0).toUpperCase()}</span>`;
                                }}
                              />
                            ) : (
                              <span>{review.user.username.charAt(0).toUpperCase()}</span>
                            )}
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Link 
                                to={`/profile/${review.user.username}`}
                                className="font-semibold text-white hover:text-blue-400 transition-colors"
                              >
                                {review.user.username}
                              </Link>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-400">
                                {formatDate(review.createdDate)}
                              </span>
                            </div>
                            {review.review && (
                              <p className="text-gray-300 leading-relaxed">{review.review}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Reviews Yet</h3>
                    <p className="text-gray-400">Be the first to review this game!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <CommentSection 
                entityType={CommentableType.Game}
                entityId={game.id}
                entityTitle={game.name}
                postAuthorId={undefined}
              />
            )}

            {activeTab === 'guides' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Game Guides</h2>
                
                {/* Show guides related to this game */}
                {game.guides && game.guides.length > 0 ? (
                  <div className="grid gap-4">
                    {game.guides.slice(0, 10).map((guide, index) => (
                      <div key={guide.id || index} className="group relative bg-gradient-to-r from-white via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/10 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300/60 dark:hover:border-blue-600/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          {/* Icon with gradient background */}
                          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <BookOpen className="w-7 h-7 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Category badge */}
                            {guide.guideCategory && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium mb-3">
                                <i className={`${guide.guideCategory.iconClass || 'fas fa-tag'} text-xs`}></i>
                                <span>{guide.guideCategory.name}</span>
                              </div>
                            )}
                            
                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{guide.title}</h3>
                            
                            {/* Summary */}
                            {guide.summary && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{guide.summary}</p>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {guide.user && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {guide.user.username}
                                  </span>
                                )}
                                {guide.createdDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(guide.createdDate)}
                                  </span>
                                )}
                                {guide.viewCount && (
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {guide.viewCount}
                                  </span>
                                )}
                              </div>
                              <Link 
                                to={guide.slug ? `/guide/${guide.slug}` : `/guides/${guide.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                <span>Read Guide</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Guides Yet</h3>
                    <p className="text-gray-400">Community guides for this game will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'blogs' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Related Blogs</h2>
                
                {/* Show blogs related to this game */}
                {game.blogPosts && game.blogPosts.length > 0 ? (
                  <div className="grid gap-4">
                    {game.blogPosts.slice(0, 10).map((blog, index) => (
                      <div key={blog.id || index} className="group relative bg-gradient-to-r from-white via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/10 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 hover:border-purple-300/60 dark:hover:border-purple-600/60 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          {/* Icon with gradient background */}
                          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <PenTool className="w-7 h-7 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Category badge */}
                            {blog.category && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium mb-3">
                                <Hash className="w-3 h-3" />
                                <span>{blog.category.name}</span>
                              </div>
                            )}
                            
                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{blog.title}</h3>
                            
                            {/* Summary */}
                            {blog.summary && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{blog.summary}</p>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {blog.author && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {blog.author.username}
                                  </span>
                                )}
                                {(blog.createdDate || blog.createdAt) && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(blog.createdDate || blog.createdAt!)}
                                  </span>
                                )}
                                {blog.viewCount && (
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {blog.viewCount}
                                  </span>
                                )}
                              </div>
                              <Link 
                                to={blog.slug ? `/blog/${blog.slug}` : `/blogs/${blog.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                <span>Read Article</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Blogs Yet</h3>
                    <p className="text-gray-400">Related blog posts for this game will appear here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'forum' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Related Forum Posts</h2>
                
                {/* Show forum posts related to this game */}
                {game.forumPosts && game.forumPosts.length > 0 ? (
                  <div className="grid gap-4">
                    {game.forumPosts.slice(0, 10).map((post, index) => (
                      <div key={post.id || index} className="group relative bg-gradient-to-r from-white via-white to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/10 rounded-xl p-6 border border-gray-200/60 dark:border-gray-700/60 hover:border-green-300/60 dark:hover:border-green-600/60 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          {/* Icon with gradient background */}
                          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Users className="w-7 h-7 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Category badge */}
                            {post.category && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium mb-3">
                                <MessageCircle className="w-3 h-3" />
                                <span>{post.category.name}</span>
                              </div>
                            )}
                            
                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">{post.title}</h3>
                            
                            {/* Content preview */}
                            {post.content && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{post.content}</p>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {post.user && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {post.user.username}
                                  </span>
                                )}
                                {post.createdDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(post.createdDate)}
                                  </span>
                                )}
                                {post.viewCount && (
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {post.viewCount}
                                  </span>
                                )}
                                {post.repliesCount && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {post.repliesCount}
                                  </span>
                                )}
                              </div>
                              <Link 
                                to={`/forum/${post.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                <span>View Post</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Forum Posts Yet</h3>
                    <p className="text-gray-400">Forum discussions about this game will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                <Monitor className="w-5 h-5 text-blue-400 mr-2" />
                Quick Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 dark:text-gray-400">Developer:</span>
                  <span className="text-gray-800 dark:text-white text-right flex-1 ml-3">
                    {game.developer || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 dark:text-gray-400">Publisher:</span>
                  <span className="text-gray-800 dark:text-white text-right flex-1 ml-3">
                    {game.publisher || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 dark:text-gray-400">Release Date:</span>
                  <span className="text-gray-800 dark:text-white text-right flex-1 ml-3">{formatDate(game.releaseDate)}</span>
                </div>
                {game.gameSeries && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 dark:text-gray-400">Game Series:</span>
                    <Link 
                      to={`/games/series/${game.gameSeries?.id}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-right flex-1 ml-3 transition-colors duration-200 inline-block"
                    >
                      {game.gameSeries.name}
                    </Link>
                  </div>
                )}
                {game.isEarlyAccess && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-orange-400 text-right flex-1 ml-3">Early Access</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rate This Game - Always Visible */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-lg p-6 border border-yellow-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-2" />
                Rate This Game
                {userRating > 0 && (
                  <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                    ({userRating}/5 ★)
                  </span>
                )}
              </h3>
              <div className="flex justify-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      if (isAuthenticated) {
                        setUserRating(rating);
                        onRating(rating);
                      } else {
                        // Redirect to login or show login modal
                        window.location.href = '/login';
                      }
                    }}
                    className={`w-8 h-8 rounded transition-colors ${
                      rating <= userRating 
                        ? 'text-yellow-400' 
                        : 'text-gray-500'
                    } ${isAuthenticated ? 'hover:text-yellow-400 cursor-pointer' : 'opacity-50'}`}
                    disabled={!isAuthenticated}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                {isAuthenticated 
                  ? (userRating > 0 ? 'Your rating - click to change' : 'Click to rate this game')
                  : 'Login to rate this game'
                }
              </p>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                Statistics
              </h3>
              <div className="space-y-4">
                {/* User Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Player Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <div className="text-green-400 font-bold">1.2K</div>
                      <div className="text-gray-600 dark:text-gray-400">Playing</div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <div className="text-blue-400 font-bold">3.4K</div>
                      <div className="text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <div className="text-purple-400 font-bold">856</div>
                      <div className="text-gray-600 dark:text-gray-400">Want to Play</div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <div className="text-orange-400 font-bold">234</div>
                      <div className="text-gray-600 dark:text-gray-400">Favorites</div>
                    </div>
                  </div>
                </div>

                {/* Community Activity */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Community Activity</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Reviews:</span>
                      <span className="text-gray-800 dark:text-white">{game.totalReviews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Screenshots:</span>
                      <span className="text-gray-800 dark:text-white">{game.screenshots?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Guides:</span>
                      <span className="text-gray-800 dark:text-white">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Discussions:</span>
                      <span className="text-gray-800 dark:text-white">43</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Beat Times */}
            {game.beatTimes && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                  <Clock className="w-5 h-5 text-green-400 mr-2" />
                  How Long to Beat
                </h3>
                <div className="space-y-3">
                  {game.beatTimes.mainStory && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Main Story:</span>
                      <span className="text-gray-800 dark:text-white">{game.beatTimes.mainStory}h</span>
                    </div>
                  )}
                  {game.beatTimes.mainPlusExtras && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Main + Extras:</span>
                      <span className="text-gray-800 dark:text-white">{game.beatTimes.mainPlusExtras}h</span>
                    </div>
                  )}
                  {game.beatTimes.completionist && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Completionist:</span>
                      <span className="text-gray-800 dark:text-white">{game.beatTimes.completionist}h</span>
                    </div>
                  )}
                  {game.beatTimes.allStyles && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">All Styles:</span>
                      <span className="text-white">{game.beatTimes.allStyles}h</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* External Links */}
            {game.websites && game.websites.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <ExternalLink className="w-5 h-5 text-purple-400 mr-2" />
                  External Links
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {game.websites?.filter(website => website?.url).map((website) => {
                    const getLinkIcon = (url: string, category: string) => {
                      if (!url) return <Globe className="w-4 h-4 text-gray-400" />;
                      const domain = url.toLowerCase();
                      if (domain.includes('steam')) return <Monitor className="w-4 h-4 text-blue-500" />;
                      if (domain.includes('epic')) return <Gamepad2 className="w-4 h-4 text-purple-500" />;
                      if (domain.includes('gog')) return <Award className="w-4 h-4 text-orange-500" />;
                      if (domain.includes('microsoft') || domain.includes('xbox')) return <Monitor className="w-4 h-4 text-green-500" />;
                      if (domain.includes('playstation') || domain.includes('sony')) return <Gamepad2 className="w-4 h-4 text-blue-600" />;
                      if (domain.includes('nintendo')) return <Gamepad2 className="w-4 h-4 text-red-500" />;
                      if (domain.includes('itch')) return <Globe className="w-4 h-4 text-red-400" />;
                      if (domain.includes('twitch')) return <Video className="w-4 h-4 text-purple-600" />;
                      if (domain.includes('youtube')) return <Video className="w-4 h-4 text-red-600" />;
                      if (domain.includes('twitter')) return <MessageSquare className="w-4 h-4 text-blue-400" />;
                      if (domain.includes('facebook')) return <Users className="w-4 h-4 text-blue-700" />;
                      if (domain.includes('instagram')) return <Image className="w-4 h-4 text-pink-500" />;
                      if (domain.includes('discord')) return <MessageSquare className="w-4 h-4 text-indigo-500" />;
                      if (domain.includes('reddit')) return <MessageSquare className="w-4 h-4 text-orange-600" />;
                      if (domain.includes('wikipedia')) return <BookOpen className="w-4 h-4 text-gray-500" />;
                      if (category && category.toLowerCase().includes('official')) return <Globe className="w-4 h-4 text-green-400" />;
                      return <ExternalLink className="w-4 h-4 text-gray-400" />;
                    };

                    const getLinkName = (url: string, category: string, name?: string) => {
                      if (name) return name;
                      if (!url) return 'Unknown';
                      const domain = url.toLowerCase();
                      if (domain.includes('steam')) return 'Steam';
                      if (domain.includes('epic')) return 'Epic Games';
                      if (domain.includes('gog')) return 'GOG';
                      if (domain.includes('microsoft') || domain.includes('xbox')) return 'Xbox';
                      if (domain.includes('playstation') || domain.includes('sony')) return 'PlayStation';
                      if (domain.includes('nintendo')) return 'Nintendo';
                      if (domain.includes('itch')) return 'Itch.io';
                      if (domain.includes('twitch')) return 'Twitch';
                      if (domain.includes('youtube')) return 'YouTube';
                      if (domain.includes('twitter')) return 'Twitter';
                      if (domain.includes('facebook')) return 'Facebook';
                      if (domain.includes('instagram')) return 'Instagram';
                      if (domain.includes('discord')) return 'Discord';
                      if (domain.includes('reddit')) return 'Reddit';
                      if (domain.includes('wikipedia')) return 'Wikipedia';
                      return category || 'Website';
                    };

                    return (
                      <a
                        key={website.id}
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
                      >
                        <div className="flex-shrink-0">{getLinkIcon(website.url || '', website.category || '')}</div>
                        <span className="text-sm text-gray-300 group-hover:text-white truncate">
                          {getLinkName(website.url || '', website.category || '', website.name)}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Similar Games Section */}
        <div className="max-w-7xl mx-auto px-6 py-12 mt-8 border-t border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center text-gray-800 dark:text-white">
              <Gamepad2 className="w-6 h-6 text-blue-400 mr-3" />
              Similar Games
            </h2>
            {totalPages > 1 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {similarGamesPage + 1} / {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={prevSimilarGamesPage}
                    disabled={similarGamesPage === 0}
                    className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800 dark:text-white" />
                  </button>
                  <button
                    onClick={nextSimilarGamesPage}
                    disabled={similarGamesPage === totalPages - 1}
                    className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800 dark:text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {similarGames && similarGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {visibleSimilarGames.map((similarGame) => (
                <Link 
                  key={similarGame.id} 
                  to={similarGame.slug ? `/games/${similarGame.slug}` : `/games/${similarGame.id}`} 
                  className="group cursor-pointer"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 h-full flex flex-col border border-gray-200 dark:border-gray-700">
                    {/* Game Cover */}
                    <div className="aspect-[3/4] overflow-hidden relative">
                      {similarGame.coverImageUrl ? (
                        <>
                          <img
                            src={similarGame.coverImageUrl}
                            alt={similarGame.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="hidden absolute inset-0 w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            <Gamepad2 className="w-12 h-12 text-gray-500" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <Gamepad2 className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      {similarGame.rating && similarGame.rating > 0 && (
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-lg flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-white font-medium">
                            {similarGame.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Game Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-2 leading-tight line-clamp-2 flex-1">
                        {similarGame.name}
                      </h3>
                      
                      {/* Release Date */}
                      {similarGame.releaseDate && (
                        <div className="flex items-center space-x-1 mb-2">
                          <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(similarGame.releaseDate).getFullYear()}
                          </span>
                        </div>
                      )}
                      
                      {/* Genres */}
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {similarGame.genres?.slice(0, 2).map((genre: any, index: number) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-400 rounded text-xs font-medium"
                          >
                            {typeof genre === 'string' ? genre : genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No similar games found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeLightbox();
            }
          }}
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <button 
              onClick={goToPrevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3 transition-colors duration-200"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button 
              onClick={goToNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3 transition-colors duration-200"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Main image or video */}
          <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {lightboxImages[currentImageIndex]?.url.includes('youtube.com') || 
             lightboxImages[currentImageIndex]?.url.includes('youtu.be') ? (
              <iframe
                src={lightboxImages[currentImageIndex]?.url.replace('watch?v=', 'embed/')}
                title={lightboxImages[currentImageIndex]?.title || 'Video'}
                className="w-full h-full rounded-lg"
                style={{ width: '80vw', height: '45vw', maxWidth: '1280px', maxHeight: '720px' }}
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <img 
                src={lightboxImages[currentImageIndex]?.url}
                alt={lightboxImages[currentImageIndex]?.title || 'Screenshot'}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              />
            )}
          </div>

          {/* Image counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-75 px-4 py-2 rounded-full text-sm font-medium">
              {currentImageIndex + 1} / {lightboxImages.length}
            </div>
          )}

          {/* Image title */}
          {lightboxImages[currentImageIndex]?.title && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-75 px-4 py-2 rounded-lg text-center max-w-md">
              {lightboxImages[currentImageIndex].title}
            </div>
          )}
        </div>
      )}
    </div>
  );
};