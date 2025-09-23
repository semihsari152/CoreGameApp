import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Edit3, 
  Save, 
  X,
  Camera,
  Trophy,
  Star,
  Gamepad2,
  MessageSquare,
  BookOpen,
  Settings,
  Eye,
  Clock,
  ExternalLink,
  Heart,
  ThumbsUp,
  Award,
  TrendingUp,
  Activity,
  Users,
  Grid,
  List,
  Filter,
  Search,
  MoreVertical,
  Shield,
  Crown,
  Zap,
  Target
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { User as UserType, Game, GameRating, UserRole } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
  location?: string;
  website?: string;
}

interface UserStats {
  totalXP: number;
  level: number;
  gamesRated: number;
  guidesCreated: number;
  forumTopics: number;
  blogPosts: number;
  commentsCount: number;
  likesReceived: number;
  joinDate: string;
  lastActivity: string;
}

interface ActivityItem {
  id: string;
  type: 'game_rated' | 'guide_created' | 'forum_topic' | 'blog_post' | 'comment';
  title: string;
  description?: string;
  date: string;
  rating?: number;
  gameId?: number;
  gameName?: string;
  url?: string;
}

const EnhancedProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  // Determine if viewing own profile or another user's
  const isOwnProfile = !username || username === currentUser?.username;
  const profileUserId = isOwnProfile ? currentUser?.id : undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>();

  // Fetch user profile data
  const { data: profileUser } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => username && !isOwnProfile 
      ? apiService.users.getByUsername(username) 
      : Promise.resolve(currentUser),
    enabled: !!username || !!currentUser
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', profileUserId],
    queryFn: () => apiService.users.getStats(profileUserId!),
    enabled: !!profileUserId
  });

  // Fetch user's game ratings
  const { data: gameRatings } = useQuery({
    queryKey: ['user-game-ratings', profileUserId],
    queryFn: () => apiService.users.getGameRatings(profileUserId!),
    enabled: !!profileUserId && activeTab === 'games'
  });

  // Fetch user's guides
  const { data: userGuides } = useQuery({
    queryKey: ['user-guides', profileUserId],
    queryFn: () => apiService.guides.getByUser(profileUserId!),
    enabled: !!profileUserId && activeTab === 'guides'
  });

  // Fetch user's forum topics
  const { data: userTopics } = useQuery({
    queryKey: ['user-forum-topics', profileUserId],
    queryFn: () => apiService.forum.getTopics({ userId: profileUserId }),
    enabled: !!profileUserId && activeTab === 'forums'
  });

  // Fetch user's blog posts
  const { data: userBlogs } = useQuery({
    queryKey: ['user-blogs', profileUserId],
    queryFn: () => apiService.blogs.getAll({ authorId: profileUserId }),
    enabled: !!profileUserId && activeTab === 'blogs'
  });

  // Fetch user activity feed
  const { data: userActivity } = useQuery({
    queryKey: ['user-activity', profileUserId],
    queryFn: () => apiService.users.getActivity(profileUserId!),
    enabled: !!profileUserId && activeTab === 'activity'
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!isOwnProfile) return;
    
    try {
      await updateProfile(data);
      toast.success('Profil başarıyla güncellendi');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
    }
  };

  const handleEditCancel = () => {
    reset();
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    return formatDate(dateString);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case UserRole.Moderator:
        return <Shield className="w-4 h-4 text-blue-500" />;
      case UserRole.User:
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 25) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (level >= 10) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const user = profileUser || currentUser;

  const stats = [
    { label: 'Toplam XP', value: userStats?.totalXP || 0, icon: Trophy, color: 'text-yellow-600' },
    { label: 'Level', value: userStats?.level || 1, icon: Target, color: 'text-purple-600' },
    { label: 'Oyun Puanı', value: userStats?.gamesRated || 0, icon: Star, color: 'text-blue-600' },
    { label: 'Kılavuz', value: userStats?.guidesCreated || 0, icon: BookOpen, color: 'text-green-600' },
    { label: 'Forum Konusu', value: userStats?.forumTopics || 0, icon: MessageSquare, color: 'text-indigo-600' },
    { label: 'Blog Yazısı', value: userStats?.blogPosts || 0, icon: BookOpen, color: 'text-red-600' },
    { label: 'Yorum', value: userStats?.commentsCount || 0, icon: MessageSquare, color: 'text-gray-600' },
    { label: 'Beğeni', value: userStats?.likesReceived || 0, icon: Heart, color: 'text-pink-600' },
  ];

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: User, count: null },
    { id: 'activity', label: 'Aktivite', icon: Activity, count: null },
    { id: 'games', label: 'Oyunlarım', icon: Gamepad2, count: userStats?.gamesRated },
    { id: 'guides', label: 'Kılavuzlarım', icon: BookOpen, count: userStats?.guidesCreated },
    { id: 'forums', label: 'Forum Konularım', icon: MessageSquare, count: userStats?.forumTopics },
    { id: 'blogs', label: 'Blog Yazılarım', icon: BookOpen, count: userStats?.blogPosts },
  ];

  if (isOwnProfile && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Kullanıcı Bulunamadı
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aradığınız kullanıcı bulunamadı veya profili gizli.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-4xl text-white font-bold">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  user.username?.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Level Badge */}
              <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full ${getLevelColor(userStats?.level || 1)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                {userStats?.level || 1}
              </div>

              {/* Upload button for own profile */}
              {isOwnProfile && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-dark-800 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {user.firstName || user.lastName 
                    ? `${user.firstName} ${user.lastName}`.trim() 
                    : user.username}
                </h1>
                {getRoleIcon(user.role)}
              </div>
              
              <p className="text-primary-100 text-lg mb-3">@{user.username}</p>
              
              {user.bio && (
                <p className="text-primary-100 max-w-2xl mb-4">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-primary-100">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(user.createdAt)} tarihinde katıldı</span>
                </div>
                
                {user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}

                {user.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-white underline"
                    >
                      Website
                    </a>
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>Son aktivite: {formatRelativeTime(user.lastLoginAt || user.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Profili Düzenle
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button className="btn-primary bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Users className="w-4 h-4 mr-2" />
                    Takip Et
                  </button>
                  <button className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mesaj
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <stat.icon className={`w-5 h-5 ${stat.color} bg-white/20 p-1 rounded`} />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-primary-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="p-6 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Son Aktiviteler
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Activity items would be displayed here */}
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Henüz aktivite yok</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats & Achievement */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Hızlı İstatistikler
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">XP İlerlemesi</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {userStats?.totalXP || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(((userStats?.totalXP || 0) % 1000) / 10, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sonraki level için {1000 - ((userStats?.totalXP || 0) % 1000)} XP
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Son Başarımlar
                </h3>
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Henüz başarım yok</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Oyun Puanları ({userStats?.gamesRated || 0})
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {gameRatings && gameRatings.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {gameRatings.map((rating: any) => (
                  <div key={rating.gameId} className="card p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <img
                        src={rating.game?.coverImageUrl || '/placeholder-game.jpg'}
                        alt={rating.game?.name}
                        className="w-16 h-20 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-game.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/games/${rating.gameId}`}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {rating.game?.name}
                        </Link>
                        <div className="flex items-center mt-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < rating.rating ? 'fill-current' : ''}`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {rating.rating}/5
                          </span>
                        </div>
                        {rating.review && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {rating.review}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(rating.createdDate || rating.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Henüz oyun puanı yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isOwnProfile ? 'Oyunları puanlayarak başlayın!' : 'Kullanıcı henüz oyun puanlamış.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab !== 'overview' && activeTab !== 'games' && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Bu bölüm geliştiriliyor
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {tabs.find(t => t.id === activeTab)?.label} bölümü yakında eklenecek.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profili Düzenle
              </h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad
                  </label>
                  <input
                    {...register('firstName')}
                    className="input"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Soyad
                  </label>
                  <input
                    {...register('lastName')}
                    className="input"
                    placeholder="Soyadınız"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  className="input h-24 resize-none"
                  placeholder="Kendiniz hakkında kısa bilgi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Konum
                </label>
                <input
                  {...register('location')}
                  className="input"
                  placeholder="Şehir, Ülke"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  {...register('website')}
                  className="input"
                  placeholder="https://website.com"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProfilePage;