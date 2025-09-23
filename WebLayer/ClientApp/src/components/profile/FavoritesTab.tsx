import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Heart, 
  Star, 
  Bookmark,
  Calendar,
  User as UserIcon,
  MessageSquare,
  BookOpen,
  Users,
  Gamepad2,
  Eye,
  ThumbsUp,
  Filter,
  Grid,
  List,
  ExternalLink
} from 'lucide-react';
import { GameListType, FavoriteType } from '../../types';
import { userGameStatusAPI, favoritesAPI } from '../../services/api';
import { Link } from 'react-router-dom';

interface FavoritesTabProps {
  userId: number;
  isOwnProfile: boolean;
}

type FavoriteCategory = 'games' | 'blogs' | 'guides' | 'forum' | 'users';

const FavoritesTab: React.FC<FavoritesTabProps> = ({ userId, isOwnProfile }) => {
  const [activeCategory, setActiveCategory] = useState<FavoriteCategory>('games');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch favorite games
  const { data: favoriteGames = [], isLoading: gamesLoading } = useQuery(
    ['user-favorite-games', userId],
    () => favoritesAPI.getUserFavorites(userId, FavoriteType.Game),
    {
      enabled: activeCategory === 'games'
    }
  );

  // Fetch favorite blogs
  const { data: favoriteBlogs = [], isLoading: blogsLoading } = useQuery(
    ['user-favorite-blogs', userId],
    () => favoritesAPI.getUserFavorites(userId, FavoriteType.BlogPost),
    {
      enabled: activeCategory === 'blogs'
    }
  );

  // Fetch favorite guides
  const { data: favoriteGuides = [], isLoading: guidesLoading } = useQuery(
    ['user-favorite-guides', userId],
    () => favoritesAPI.getUserFavorites(userId, FavoriteType.Guide),
    {
      enabled: activeCategory === 'guides'
    }
  );

  // Fetch favorite forum topics
  const { data: favoriteForumTopics = [], isLoading: forumLoading } = useQuery(
    ['user-favorite-forum', userId],
    () => favoritesAPI.getUserFavorites(userId, FavoriteType.ForumTopic),
    {
      enabled: activeCategory === 'forum'
    }
  );

  // Fetch favorite users
  const { data: favoriteUsers = [], isLoading: usersLoading } = useQuery(
    ['user-favorite-users', userId],
    () => favoritesAPI.getUserFavorites(userId, FavoriteType.User),
    {
      enabled: activeCategory === 'users'
    }
  );

  const getCategoryData = () => {
    switch (activeCategory) {
      case 'games':
        return { data: favoriteGames, isLoading: gamesLoading };
      case 'blogs':
        return { data: favoriteBlogs, isLoading: blogsLoading };
      case 'guides':
        return { data: favoriteGuides, isLoading: guidesLoading };
      case 'forum':
        return { data: favoriteForumTopics, isLoading: forumLoading };
      case 'users':
        return { data: favoriteUsers, isLoading: usersLoading };
      default:
        return { data: [], isLoading: false };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const { data, isLoading } = getCategoryData();

  // Category configuration
  const categories = [
    {
      key: 'games' as FavoriteCategory,
      label: 'Oyunlar',
      icon: Gamepad2,
      count: favoriteGames.length,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      key: 'blogs' as FavoriteCategory,
      label: 'Blog Yazıları',
      icon: BookOpen,
      count: favoriteBlogs.length,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      key: 'guides' as FavoriteCategory,
      label: 'Kılavuzlar',
      icon: BookOpen,
      count: favoriteGuides.length,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      key: 'forum' as FavoriteCategory,
      label: 'Forum Konuları',
      icon: MessageSquare,
      count: favoriteForumTopics.length,
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      key: 'users' as FavoriteCategory,
      label: 'Kullanıcılar',
      icon: Users,
      count: favoriteUsers.length,
      color: 'text-pink-600 dark:text-pink-400'
    }
  ];

  const renderGameCard = (gameStatus: any, index: number) => {
    const game = gameStatus.game;
    if (!game) return null;

    if (viewMode === 'list') {
      return (
        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              {game.coverImageUrl ? (
                <img src={game.coverImageUrl} alt={game.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Link to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                {game.name}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Favorilere eklendi: {formatDate(gameStatus.createdDate)}
              </p>
              {game.averageRating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{game.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <Link
        key={index}
        to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group"
      >
        <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {game.coverImageUrl ? (
            <img 
              src={game.coverImageUrl} 
              alt={game.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {game.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(gameStatus.createdDate)}
          </p>
          {game.averageRating && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{game.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  const renderContentCard = (item: any, index: number, type: FavoriteCategory) => {
    // Bu fonksiyon blogs, guides, forum topics için kullanılacak
    // Şu anda basit bir placeholder gösteriyoruz
    return (
      <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Favoriye eklendi</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {type} #{item.id}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(item.createdDate)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isOwnProfile ? 'Favorilerim' : 'Favorileri'}
          </h2>
        </div>
        
        {activeCategory === 'games' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.key;
            
            return (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{category.label}</span>
                {category.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {category.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Yükleniyor...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz favori yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isOwnProfile 
                ? `Henüz hiç ${categories.find(c => c.key === activeCategory)?.label.toLowerCase()} favorilere eklenmemiş.`
                : `Bu kullanıcı henüz hiç ${categories.find(c => c.key === activeCategory)?.label.toLowerCase()} favorilere eklememiş.`
              }
            </p>
          </div>
        ) : (
          <div className={
            activeCategory === 'games' && viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'space-y-4'
          }>
            {activeCategory === 'games' 
              ? data.map((item, index) => renderGameCard(item, index))
              : data.map((item, index) => renderContentCard(item, index, activeCategory))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesTab;