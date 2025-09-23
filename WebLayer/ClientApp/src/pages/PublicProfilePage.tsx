import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Calendar,
  Activity,
  Award,
  TrendingUp,
  Users,
  MessageSquare,
  BookOpen,
  Heart,
  Gamepad2,
  Crown,
  Shield,
  ThumbsUp,
  Star,
  Eye,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Mail,
  ThumbsDown,
  Flag
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { User as UserType, UserRole, CommentableType, LikableType } from '../types';
import { apiService } from '../services/api';
import { friendService } from '../services/friendService';
import { conversationService } from '../services/conversationService';
import toast from 'react-hot-toast';
import CommentSection from '../components/comments/CommentSection';
import LikeButton from '../components/common/LikeButton';
import ReportModal from '../components/common/ReportModal';
import { ReportType, ReportableType } from '../services/reportService';

interface UserStats {
  totalXP: number;
  level: number;
  gamesRated: number;
  guidesCreated: number;
  forumTopics: number;
  blogPosts: number;
  commentsCount: number;
  likesReceived: number;
  dislikesReceived: number;
  joinDate: string;
  lastActivity: string;
}

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [friendshipStatus, setFriendshipStatus] = useState<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
    requestId?: number;
  } | null>(null);
  const [isLoadingFriendship, setIsLoadingFriendship] = useState(false);
  const [isStartingMessage, setIsStartingMessage] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.username === username;
  
  // Fetch user profile data
  const { data: profileUser, isLoading: userLoading, error: userError } = useQuery(
    ['public-user-profile', username],
    async () => {
      if (!username) {
        throw new Error('Username is required');
      }
      
      try {
        const result = await apiService.users.getByUsername(username);
        
        if (!result) {
          throw new Error('User not found');
        }
        
        return result;
      } catch (error: any) {
        // Don't log 404 errors to console - these are expected for deleted users
        if (error?.response?.status !== 404) {
          console.error('Error fetching user profile:', error);
        }
        throw error;
      }
    },
    {
      enabled: !!username && !authLoading,
      retry: (failureCount, error: any) => {
        // Don't retry on 404 errors (user not found/deleted)
        if (error?.response?.status === 404) {
          return false;
        }
        return failureCount < 1;
      }
    }
  );

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery(
    ['public-user-stats', profileUser?.id],
    async () => {
      if (!profileUser?.id) return null;
      console.log('Fetching stats for user:', profileUser.id);
      try {
        const statsResponse = await fetch(`http://localhost:5124/api/users/${profileUser.id}/stats`);
        const statsData = await statsResponse.json();
        console.log('Direct stats API response:', statsData);
        return statsData;
      } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
      }
    },
    {
      enabled: !!profileUser?.id,
      retry: false
    }
  );

  // Check friendship status
  const { data: friendshipStatusData } = useQuery(
    ['friendship-status', profileUser?.id],
    () => friendService.getFriendshipStatus(profileUser!.id),
    {
      enabled: !!profileUser && !!currentUser && !isOwnProfile
    }
  );

  // Set friendship status when data changes
  React.useEffect(() => {
    if (friendshipStatusData) {
      setFriendshipStatus(friendshipStatusData);
    }
  }, [friendshipStatusData]);

  // Fetch user's content based on active tab
  const { data: userContent } = useQuery(
    ['public-user-content', profileUser?.id, activeTab],
    async () => {
      if (!profileUser?.id) return null;
      
      switch (activeTab) {
        case 'guides':
          console.log('Fetching guides for user:', profileUser.id);
          try {
            const guidesResponse = await fetch(`http://localhost:5124/api/users/${profileUser.id}/guides`);
            const guidesData = await guidesResponse.json();
            console.log('Direct guides API response:', guidesData);
            return guidesData;
          } catch (error) {
            console.error('Error fetching guides:', error);
            return [];
          }
        case 'blogs':
          console.log('Fetching blogs for user:', profileUser.id);
          try {
            const blogsResponse = await fetch(`http://localhost:5124/api/users/${profileUser.id}/blogs`);
            const blogsData = await blogsResponse.json();
            console.log('Direct blogs API response:', blogsData);
            return blogsData;
          } catch (error) {
            console.error('Error fetching blogs:', error);
            return [];
          }
        case 'posts':
          console.log('Fetching forum posts for user:', profileUser.id);
          try {
            const postsResponse = await fetch(`http://localhost:5124/api/users/${profileUser.id}/forum-posts`);
            const postsData = await postsResponse.json();
            console.log('Direct forum posts API response:', postsData);
            return postsData;
          } catch (error) {
            console.error('Error fetching forum posts:', error);
            return [];
          }
        default:
          return null;
      }
    },
    {
      enabled: !!profileUser?.id && ['guides', 'blogs', 'posts'].includes(activeTab),
      retry: false
    }
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleReportUser = async (reportType: ReportType, reason: string, description?: string) => {
    if (!profileUser) return;
    
    try {
      setIsReporting(true);
      const { reportService } = await import('../services/reportService');
      await reportService.createReport({
        reportableType: ReportableType.User,
        reportableEntityId: profileUser.id,
        reportType,
        reason,
        description
      });
      toast.success('Kullanıcı başarıyla raporlandı');
      setShowReportModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rapor gönderilirken bir hata oluştu');
    } finally {
      setIsReporting(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    return formatDate(dateString);
  };

  const handleFriendRequest = async () => {
    console.log('handleFriendRequest called');
    console.log('profileUser:', profileUser);
    console.log('isLoadingFriendship:', isLoadingFriendship);
    console.log('friendshipStatus:', friendshipStatus);
    
    if (!profileUser || isLoadingFriendship) return;
    
    setIsLoadingFriendship(true);
    try {
      if (friendshipStatus?.status === 'none') {
        console.log('Sending friend request...');
        // Send friend request
        await friendService.sendFriendRequest(profileUser.id);
        setFriendshipStatus({ status: 'pending_sent' });
        toast.success('Arkadaş isteği gönderildi');
      } else if (friendshipStatus?.status === 'pending_sent') {
        console.log('Canceling friend request...', friendshipStatus.requestId);
        // Cancel friend request
        if (friendshipStatus.requestId) {
          await friendService.cancelFriendRequest(friendshipStatus.requestId);
          setFriendshipStatus({ status: 'none' });
          toast.success('Arkadaş isteği iptal edildi');
        } else {
          console.error('No requestId for canceling');
          toast.error('İstek ID bulunamadı');
        }
      } else if (friendshipStatus?.status === 'pending_received') {
        console.log('Accepting friend request...', friendshipStatus.requestId);
        // Accept friend request
        if (friendshipStatus.requestId) {
          await friendService.acceptFriendRequest(friendshipStatus.requestId);
          setFriendshipStatus({ status: 'friends' });
          toast.success('Arkadaş isteği kabul edildi');
        } else {
          console.error('No requestId for accepting');
          toast.error('İstek ID bulunamadı');
        }
      } else if (friendshipStatus?.status === 'friends') {
        console.log('Removing friend...');
        // Remove friend
        await friendService.removeFriend(profileUser.id);
        setFriendshipStatus({ status: 'none' });
        toast.success('Arkadaşlık kaldırıldı');
      }
    } catch (error) {
      console.error('Friend request error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoadingFriendship(false);
    }
  };

  const handleStartMessage = async () => {
    if (!profileUser || isStartingMessage) return;
    
    setIsStartingMessage(true);
    try {
      const result = await conversationService.startDirectMessage(profileUser.id);
      
      if (result.isNewConversation) {
        toast.success('Yeni sohbet başlatıldı');
      } else {
        toast.success('Mevcut sohbet açıldı');
      }
      
      // Chat sayfasına yönlendir ve ilgili konuşmayı aç
      navigate(`/chat?conversation=${result.conversationId}`);
      
    } catch (error: any) {
      console.error('Error starting message:', error);
      
      // Arkadaş olmama durumunu kontrol et
      if (error.response?.status === 403 || error.response?.data?.message?.includes('arkadaş')) {
        toast.error('Sadece arkadaşlarınızla mesajlaşabilirsiniz');
      } else {
        toast.error(error.response?.data?.message || 'Mesaj başlatılamadı');
      }
    } finally {
      setIsStartingMessage(false);
    }
  };

  const getFriendButtonText = () => {
    if (isLoadingFriendship) return 'Yükleniyor...';
    
    switch (friendshipStatus?.status) {
      case 'pending_sent':
        return 'İsteği İptal Et';
      case 'pending_received':
        return 'İsteği Kabul Et';
      case 'friends':
        return 'Arkadaşlıktan Çıkar';
      default:
        return 'Arkadaş Ekle';
    }
  };

  const getFriendButtonStyle = () => {
    switch (friendshipStatus?.status) {
      case 'pending_sent':
        return 'bg-gray-600 hover:bg-gray-700 border-gray-500';
      case 'pending_received':
        return 'bg-green-600 hover:bg-green-700 border-green-500';
      case 'friends':
        return 'bg-red-600 hover:bg-red-700 border-red-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 border-blue-500';
    }
  };

  // Check privacy settings from database
  const checkPrivacySetting = (setting: string) => {
    if (!profileUser) return true;
    
    console.log(`Checking ${setting} for user: ${profileUser.username}`);
    
    // Use database values from the user object
    switch (setting) {
      case 'profileVisibility':
        const profileVisible = profileUser.isProfileVisible ?? true;
        console.log(`Profile visibility for ${profileUser.username}: ${profileVisible}`);
        return profileVisible;
      case 'activityStatus':
        const activityVisible = profileUser.isActivityStatusVisible ?? true;
        console.log(`Activity status visibility for ${profileUser.username}: ${activityVisible}`);
        return activityVisible;
      case 'gameListVisibility':
        const gameListVisible = profileUser.isGameListVisible ?? true;
        console.log(`Game list visibility for ${profileUser.username}: ${gameListVisible}`);
        return gameListVisible;
      default:
        console.log(`Unknown privacy setting: ${setting}, defaulting to true`);
        return true;
    }
  };

  // Set privacy settings for current user (when they change their own settings)
  const setUserPrivacySetting = (setting: string, value: boolean) => {
    if (currentUser?.username) {
      localStorage.setItem(`${setting}_${currentUser.username}`, value.toString());
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case UserRole.Moderator:
        return <Shield className="w-5 h-5 text-blue-500" />;
      case UserRole.User:
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return 'Admin';
      case UserRole.Moderator:
        return 'Moderator';
      case UserRole.User:
      default:
        return 'Kullanıcı';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 25) return 'from-blue-500 to-cyan-500';
    if (level >= 10) return 'from-green-500 to-emerald-500';
    return 'from-gray-400 to-gray-500';
  };

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Check if profile is private and current user is not the profile owner
  const isProfilePrivate = profileUser && !isOwnProfile && !checkPrivacySetting('profileVisibility');
  
  // Check if account is deleted (soft delete) - but now we show account info normally
  // Only show a simple banner on profile page
  const isAccountDeleted = profileUser && !profileUser.isActive;

  // User not found or error, or private profile (removed deleted account check)
  if (userError || (!userLoading && !profileUser) || isProfilePrivate) {
    console.log('User not found or error:', userError, 'profileUser:', profileUser, 'isPrivate:', isProfilePrivate);
    
    if (isProfilePrivate) {
      // Beautiful Private Profile UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            {/* Lock Icon with Glow Effect */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl opacity-60 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-lg rounded-full p-6 border border-white/20 shadow-2xl">
                <Shield className="w-16 h-16 text-white mx-auto" />
              </div>
            </div>

            {/* Title with Gradient Text */}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4 font-gaming">
              Profil Gizli
            </h1>
            
            {/* Subtitle */}
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Bu kullanıcının profili gizlilik ayarları nedeniyle görüntülenemiyor.
            </p>

            {/* Glass Card with Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl mb-8">
              <div className="flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white/60 mr-2" />
                <span className="text-white/80 font-medium">Gizlilik Koruması Aktif</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Kullanıcı profil görünürlük ayarını kapalı konuma getirmiş. Bu durumda profil bilgileri, oyun aktiviteleri ve diğer kişisel veriler korunmaktadır.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Link 
                to="/" 
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Ana Sayfaya Dön
                </div>
              </Link>
            </div>

            {/* Bottom Decorative Element */}
            <div className="mt-12 flex justify-center space-x-2 opacity-40">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-pulse"
                  style={{animationDelay: `${i * 0.5}s`}}
                ></div>
              ))}
            </div>
          </div>

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>
      );
    }

    if (isAccountDeleted) {
      // Deleted Account UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-20 left-10 w-64 h-64 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-64 h-64 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            {/* Deleted Account Icon */}
            <div className="relative mb-8">
              <div className="relative bg-gray-800/50 backdrop-blur-lg rounded-full p-6 border border-gray-600/30 shadow-2xl">
                <User className="w-16 h-16 text-gray-400 mx-auto" />
                <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-4 font-gaming">
              Silinmiş Hesap
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Bu hesap kullanıcı tarafından silinmiştir.
            </p>

            {/* Info Card */}
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-600/20 shadow-2xl mb-8">
              <p className="text-gray-400 text-sm leading-relaxed">
                Kullanıcının profil bilgileri ve hesap detayları artık mevcut değil. 
                Ancak daha önce paylaştığı içerikler "Silinmiş Hesap" olarak görüntülenmeye devam eder.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Link 
                to="/" 
                className="group relative overflow-hidden bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-600/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Ana Sayfaya Dön
                </div>
              </Link>
            </div>

            {/* Bottom Decorative Element */}
            <div className="mt-12 flex justify-center space-x-2 opacity-30">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
                  style={{animationDelay: `${i * 0.5}s`}}
                ></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // User not found UI (keep existing simple design)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <>
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Kullanıcı Bulunamadı
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aradığınız kullanıcı bulunamadı.
            </p>
            {userError && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                Hata: {(userError as any)?.message || 'Bilinmeyen hata'}
              </p>
            )}
            <Link to="/" className="btn-primary inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </>
        </div>
      </div>
    );
  }

  const ProfileHeader = () => (
    <>
      {/* Deleted Account Banner */}
      {isAccountDeleted && (
        <div className="bg-red-600 text-white py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Bu hesap silinmiştir</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-indigo-600 to-purple-800 dark:from-indigo-700 dark:to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl text-white font-bold border-4 border-white/30 shadow-2xl overflow-hidden">
              {profileUser.avatarUrl ? (
                <img
                  src={profileUser.avatarUrl}
                  alt={profileUser.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl text-white font-bold">${profileUser.username?.charAt(0).toUpperCase()}</span>`;
                  }}
                />
              ) : (
                <span>{profileUser.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Level Badge */}
            <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(userStats?.level || 1)} flex items-center justify-center text-white font-bold text-lg shadow-lg border-4 border-white/30`}>
              {userStats?.level || 1}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                {profileUser.firstName || profileUser.lastName 
                  ? `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim() 
                  : profileUser.username}
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                {getRoleIcon(profileUser.role)}
                <span className="text-sm px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30">
                  @{profileUser.username}
                </span>
                <span className="text-sm px-3 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/30">
                  {getRoleDisplayName(profileUser.role)}
                </span>
              </div>
            </div>

            {profileUser.bio && (
              <p className="text-indigo-100 text-lg mb-6 max-w-2xl drop-shadow">
                {profileUser.bio}
              </p>
            )}

            {/* User Meta Info */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-indigo-100 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(profileUser.createdAt)} tarihinde katıldı</span>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {checkPrivacySetting('activityStatus') ? (
                  <span>Son aktivite: {formatRelativeTime(profileUser.lastLoginAt || profileUser.createdAt)}</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 italic">Kullanıcı aktivite durumunu gizlemiş</span>
                )}
              </div>
            </div>

            {/* Level & XP Progress Bar */}
            {userStats && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  {/* Level Badge */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor(userStats.level)} flex items-center justify-center shadow-lg shrink-0`}>
                    <span className="text-xl font-bold text-white">
                      {userStats.level}
                    </span>
                  </div>
                  
                  {/* Progress Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-white">
                          Level {userStats.level}
                        </span>
                        <span className="text-indigo-200 text-sm">
                          {userStats.totalXP} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-indigo-200 text-sm">
                        <span>
                          Sonraki: {1000 - ((userStats.totalXP || 0) % 1000)} XP
                        </span>
                        <span className="bg-white/10 px-3 py-1 rounded-full">
                          #{Math.floor((userStats.totalXP || 0) / 100) + 1}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out relative" 
                        style={{ width: `${Math.min(((userStats.totalXP || 0) % 1000) / 10, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  console.log('Button clicked!');
                  handleFriendRequest();
                }}
                disabled={isLoadingFriendship}
                className={`text-white px-6 py-3 rounded-lg font-medium transition-colors border flex items-center gap-2 ${getFriendButtonStyle()} ${isLoadingFriendship ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Users className="w-4 h-4" />
                {getFriendButtonText()}
              </button>
              <button 
                onClick={handleStartMessage}
                disabled={isStartingMessage}
                className={`bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/30 flex items-center gap-2 ${isStartingMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isStartingMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Açılıyor...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Mesaj
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setShowReportModal(true)}
                className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-100 px-6 py-3 rounded-lg font-medium transition-colors border border-red-500/30 flex items-center gap-2"
                title="Kullanıcıyı Raporla"
              >
                <Flag className="w-4 h-4" />
                Raporla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );

  const NavigationTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Genel Bakış', icon: TrendingUp },
      { id: 'posts', label: 'Forum Postları', icon: MessageSquare },
      { id: 'blogs', label: 'Blog Yazıları', icon: BookOpen },
      { id: 'guides', label: 'Kılavuzlar', icon: BookOpen },
      { id: 'comments', label: 'Profil Yorumları', icon: MessageSquare }
    ];

    return (
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Enhanced Stats Grid */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* 1. Alınan Beğeni */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-2xl border border-red-200 dark:border-red-700/50">
            <div className="flex items-center justify-between mb-3">
              <Heart className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-red-700 dark:text-red-300">{userStats.likesReceived || 0}</span>
            </div>
            <h4 className="font-medium text-red-600 dark:text-red-400">Alınan Beğeni</h4>
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">Toplam beğeni sayısı</p>
          </div>

          {/* 2. Alınan Dislike */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-black/20 p-6 rounded-2xl border border-gray-300 dark:border-gray-600/50">
            <div className="flex items-center justify-between mb-3">
              <ThumbsUp className="w-8 h-8 text-gray-700 dark:text-gray-400 rotate-180" />
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{userStats.dislikesReceived || 0}</span>
            </div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Alınan Dislike</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam dislike sayısı</p>
          </div>

          {/* 3. Yapılan Yorum */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700/50">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{userStats.commentsCount || 0}</span>
            </div>
            <h4 className="font-medium text-purple-600 dark:text-purple-400">Yapılan Yorum</h4>
            <p className="text-sm text-purple-500 dark:text-purple-400 mt-1">Toplam yorum sayısı</p>
          </div>

          {/* 4. Ne kadar zamandır üye */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border border-green-200 dark:border-green-700/50">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                {profileUser.createdAt ? Math.floor((new Date().getTime() - new Date(profileUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </span>
            </div>
            <h4 className="font-medium text-green-600 dark:text-green-400">Üyelik Süresi</h4>
            <p className="text-sm text-green-500 dark:text-green-400 mt-1">Gün olarak</p>
          </div>

          {/* 5. Oyun Puanları */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-center justify-between mb-3">
              <Star className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{userStats.gamesRated || 0}</span>
            </div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400">Oyun Puanları</h4>
            <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">Değerlendirilen oyunlar</p>
          </div>

          {/* 6. Forum Konu Sayısı */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-700/50">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{userStats.forumTopics || 0}</span>
            </div>
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">Forum Konuları</h4>
            <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-1">Açılan konular</p>
          </div>

          {/* 7. Guide Sayısı */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-700/50">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="w-8 h-8 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{userStats.guidesCreated || 0}</span>
            </div>
            <h4 className="font-medium text-amber-600 dark:text-amber-400">Kılavuzlar</h4>
            <p className="text-sm text-amber-500 dark:text-amber-400 mt-1">Oluşturulan rehberler</p>
          </div>

          {/* 8. Blog Sayısı */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700/50">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">{userStats.blogPosts || 0}</span>
            </div>
            <h4 className="font-medium text-orange-600 dark:text-orange-400">Blog Yazıları</h4>
            <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">Yayınlanan yazılar</p>
          </div>
        </div>
      )}
    </div>
  );

  const ContentTab = () => {
    if (!userContent || userContent.length === 0) {
      const tabConfig = {
        posts: { name: 'forum postu', icon: MessageSquare, color: 'green' },
        blogs: { name: 'blog yazısı', icon: BookOpen, color: 'blue' },
        guides: { name: 'kılavuzu', icon: BookOpen, color: 'purple' }
      };
      const config = tabConfig[activeTab as keyof typeof tabConfig];
      
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <div className={`w-20 h-20 bg-gradient-to-br ${
            config?.color === 'green' ? 'from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20' :
            config?.color === 'blue' ? 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20' :
            'from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20'
          } rounded-full flex items-center justify-center mx-auto mb-6`}>
            <config.icon className={`w-10 h-10 ${
              config?.color === 'green' ? 'text-green-600 dark:text-green-400' :
              config?.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
              'text-purple-600 dark:text-purple-400'
            }`} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Henüz {config?.name} yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Bu kullanıcının henüz {config?.name} bulunmuyor.
          </p>
        </div>
      );
    }

    // Helper function to get difficulty color (for guides)
    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty?.toLowerCase()) {
        case 'kolay':
        case 'beginner':
        case 'başlangıç':
          return 'bg-gradient-to-r from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700/50';
        case 'orta':
        case 'intermediate':
        case 'orta seviye':
          return 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700/50';
        case 'zor':
        case 'hard':
        case 'advanced':
        case 'ileri':
          return 'bg-gradient-to-r from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-700/50';
        case 'çok zor':
        case 'expert':
        case 'uzman':
          return 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700/50';
        default:
          return 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900/40 dark:to-slate-800/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50';
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'posts' ? 'Forum Postları' : 
               activeTab === 'blogs' ? 'Blog Yazıları' : 'Kılavuzlar'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeTab === 'posts' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
              activeTab === 'blogs' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
              'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
            }`}>
              {userContent?.length || 0} {activeTab === 'posts' ? 'post' : activeTab === 'blogs' ? 'yazı' : 'kılavuz'}
            </span>
          </div>
        </div>
          
        {userContent && userContent.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {userContent.map((item: any, index: number) => (
                <Link 
                  key={item.id}
                  to={item.slug ? 
                    (activeTab === 'posts' ? `/forum/${item.slug}` : 
                     activeTab === 'blogs' ? `/blog/${item.slug}` : 
                     activeTab === 'guides' ? `/guide/${item.slug}` : 
                     `/${activeTab}/${item.id}`) :
                    `/${activeTab === 'posts' ? 'forum/topic' : activeTab}/${item.id}`
                  }
                  className={`flex items-center p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
                    index === 0 ? 'rounded-t-xl' : ''
                  } ${index === userContent.length - 1 ? 'rounded-b-xl' : ''}`}
                >
                  <div className={`${
                    activeTab === 'posts' ? 'w-12 h-12' : 'w-16 h-16'
                  } bg-gradient-to-br ${
                    activeTab === 'posts' ? 'from-green-500 to-emerald-600' :
                    activeTab === 'blogs' ? 'from-blue-500 to-indigo-600' :
                    'from-purple-500 to-violet-600'
                  } rounded-lg flex items-center justify-center mr-4 shrink-0 overflow-hidden`}>
                    {(item.coverImageUrl || item.thumbnailUrl) && activeTab !== 'posts' ? (
                      <img 
                        src={item.coverImageUrl || item.thumbnailUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <>
                        {activeTab === 'posts' && <MessageSquare className="w-6 h-6 text-white" />}
                        {activeTab === 'blogs' && <BookOpen className="w-8 h-8 text-white" />}
                        {activeTab === 'guides' && <BookOpen className="w-8 h-8 text-white" />}
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className={`font-semibold text-gray-900 dark:text-white transition-colors truncate flex-1 min-w-0 ${
                        activeTab === 'posts' ? 'group-hover:text-green-600 dark:group-hover:text-green-400' :
                        activeTab === 'blogs' ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' :
                        'group-hover:text-purple-600 dark:group-hover:text-purple-400'
                      }`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {activeTab === 'posts' && item.forumCategory && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                            {item.forumCategory.name}
                          </span>
                        )}
                        {activeTab === 'blogs' && item.category && (
                          <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium">
                            📝 {item.category.name}
                          </span>
                        )}
                        {activeTab === 'guides' && item.difficulty && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getDifficultyColor(item.difficulty)}`}>
                            ⭐ {item.difficulty}
                          </span>
                        )}
                        {activeTab === 'guides' && item.guideCategory && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                            📚 {item.guideCategory.name}
                          </span>
                        )}
                        {item.game && (
                          <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                            🎮 {item.game.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {item.summary || item.content || item.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(item.createdDate || item.createdAt).toLocaleDateString('tr-TR')}</span>
                      <span>{item.viewCount || 0} görüntüleme</span>
                      <span>{activeTab === 'posts' ? (item.replyCount || 0) : (item.likeCount || 0)} {activeTab === 'posts' ? 'yanıt' : 'beğeni'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
            <div className={`w-20 h-20 bg-gradient-to-br ${
              activeTab === 'posts' ? 'from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20' :
              activeTab === 'blogs' ? 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20' :
              'from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20'
            } rounded-full flex items-center justify-center mx-auto mb-6`}>
              {activeTab === 'posts' && <MessageSquare className="w-10 h-10 text-green-600 dark:text-green-400" />}
              {activeTab === 'blogs' && <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />}
              {activeTab === 'guides' && <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400" />}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Henüz {activeTab === 'posts' ? 'forum postu' : activeTab === 'blogs' ? 'blog yazısı' : 'kılavuz'} yok
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Bu kullanıcının henüz {activeTab === 'posts' ? 'forum postu' : activeTab === 'blogs' ? 'blog yazısı' : 'kılavuzu'} bulunmuyor.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Profile Header */}
      <ProfileHeader />
      
      {/* Navigation */}
      <NavigationTabs />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Like/Dislike Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Bu profili nasıl buldunuz?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Diğer kullanıcılara yardımcı olmak için fikirlerinizi paylaşın
                </p>
              </div>
              <div className="flex items-center gap-4">
                <LikeButton
                  entityType={LikableType.User}
                  entityId={profileUser.id}
                  variant="default"
                  size="lg"
                  showCounts={true}
                  className="[&_button]:px-6 [&_button]:py-3 [&_button]:font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {['posts', 'blogs', 'guides'].includes(activeTab) && <ContentTab />}
        
        {activeTab === 'comments' && (
          <CommentSection 
            entityType={CommentableType.User}
            entityId={profileUser.id}
            entityTitle={`${profileUser.username} profili`}
            postAuthorId={undefined}
          />
        )}
      </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportUser}
          isLoading={isReporting}
          targetName={`@${profileUser?.username}`}
        />
      )}
    </div>
  );
};

export default PublicProfilePage;