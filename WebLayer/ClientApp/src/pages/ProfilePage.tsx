import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { 
  User, 
  Settings,
  Edit3, 
  Save, 
  X,
  Camera,
  Trophy,
  Star,
  Gamepad2,
  MessageSquare,
  BookOpen,
  Eye,
  Clock,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Mail,
  Activity,
  Award,
  TrendingUp,
  Users,
  Heart,
  ThumbsUp,
  Target,
  Zap,
  Shield,
  Crown,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Grid,
  List,
  MoreVertical,
  Flag
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { User as UserType, UserRole, UserGameStatus, GameListType } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import ReportModal from '../components/common/ReportModal';
import { ReportType, ReportableType, reportService } from '../services/reportService';

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

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, updateProfile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const queryClient = useQueryClient();

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

  const user = profileUser || currentUser;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleReportUser = async (reportType: ReportType, reason: string, description?: string) => {
    if (!user || isOwnProfile) return;
    
    try {
      setIsReporting(true);
      await reportService.createReport({
        reportableType: ReportableType.User,
        reportableEntityId: user.id,
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

  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {/* 1. Alınan Beğeni */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-2xl border border-red-200 dark:border-red-700/50">
        <div className="flex items-center justify-between mb-3">
          <Heart className="w-8 h-8 text-red-600" />
          <span className="text-2xl font-bold text-red-700 dark:text-red-300">{userStats?.likesReceived || 0}</span>
        </div>
        <h4 className="font-medium text-red-600 dark:text-red-400">Alınan Beğeni</h4>
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">Toplam beğeni sayısı</p>
      </div>

      {/* 2. Alınan Dislike */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <ThumbsUp className="w-8 h-8 text-slate-600 rotate-180" />
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">{userStats?.dislikesReceived || 0}</span>
        </div>
        <h4 className="font-medium text-slate-600 dark:text-slate-400">Alınan Dislike</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Toplam dislike sayısı</p>
      </div>

      {/* 3. Yapılan Yorum */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700/50">
        <div className="flex items-center justify-between mb-3">
          <MessageSquare className="w-8 h-8 text-purple-600" />
          <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{userStats?.commentsCount || 0}</span>
        </div>
        <h4 className="font-medium text-purple-600 dark:text-purple-400">Yapılan Yorum</h4>
        <p className="text-sm text-purple-500 dark:text-purple-400 mt-1">Toplam yorum sayısı</p>
      </div>

      {/* 4. Ne kadar zamandır üye */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border border-green-200 dark:border-green-700/50">
        <div className="flex items-center justify-between mb-3">
          <Calendar className="w-8 h-8 text-green-600" />
          <span className="text-2xl font-bold text-green-700 dark:text-green-300">
            {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
          </span>
        </div>
        <h4 className="font-medium text-green-600 dark:text-green-400">Üyelik Süresi</h4>
        <p className="text-sm text-green-500 dark:text-green-400 mt-1">Gün olarak</p>
      </div>

      {/* 5. Oyun Puanları */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700/50">
        <div className="flex items-center justify-between mb-3">
          <Star className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{userStats?.gamesRated || 0}</span>
        </div>
        <h4 className="font-medium text-blue-600 dark:text-blue-400">Oyun Puanları</h4>
        <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">Değerlendirilen oyunlar</p>
      </div>

      {/* 6. Forum Konu Sayısı */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-700/50">
        <div className="flex items-center justify-between mb-3">
          <MessageSquare className="w-8 h-8 text-indigo-600" />
          <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{userStats?.forumTopics || 0}</span>
        </div>
        <h4 className="font-medium text-indigo-600 dark:text-indigo-400">Forum Konuları</h4>
        <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-1">Açılan konular</p>
      </div>

      {/* 7. Guide Sayısı */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-700/50">
        <div className="flex items-center justify-between mb-3">
          <BookOpen className="w-8 h-8 text-amber-600" />
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{userStats?.guidesCreated || 0}</span>
        </div>
        <h4 className="font-medium text-amber-600 dark:text-amber-400">Kılavuzlar</h4>
        <p className="text-sm text-amber-500 dark:text-amber-400 mt-1">Oluşturulan rehberler</p>
      </div>

      {/* 8. Blog Sayısı */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700/50">
        <div className="flex items-center justify-between mb-3">
          <BookOpen className="w-8 h-8 text-orange-600" />
          <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">{userStats?.blogPosts || 0}</span>
        </div>
        <h4 className="font-medium text-orange-600 dark:text-orange-400">Blog Yazıları</h4>
        <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">Yayınlanan yazılar</p>
      </div>
    </div>
  );

  const UserCard = () => (
    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl text-white font-bold shadow-lg">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              user.username?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {userStats?.level || 1}
          </div>

          {isOwnProfile && (
            <button className="absolute top-0 right-0 w-6 h-6 bg-white dark:bg-dark-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-md hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.firstName || user.lastName 
                ? `${user.firstName} ${user.lastName}`.trim() 
                : user.username}
            </h1>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              {user.role === UserRole.Admin && <Crown className="w-5 h-5 text-yellow-500" />}
              {user.role === UserRole.Moderator && <Shield className="w-5 h-5 text-blue-500" />}
              <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-full">
                @{user.username}
              </span>
            </div>
          </div>

          {user.bio && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-2xl">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                  className="hover:text-primary-600 dark:hover:text-primary-400 underline"
                >
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {isOwnProfile ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Profili Düzenle
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="btn-secondary"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button className="btn-primary">
                <Users className="w-4 h-4 mr-2" />
                Takip Et
              </button>
              <button className="btn-secondary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Mesaj
              </button>
              <button 
                onClick={() => setShowReportModal(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Kullanıcıyı Raporla"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const NavigationTabs = () => {
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
      { id: 'activity', label: 'Aktivite', icon: Activity },
      { id: 'games', label: 'Oyun Durumları', icon: Gamepad2 },
      { id: 'guides', label: 'Kılavuzlarım', icon: BookOpen },
      { id: 'achievements', label: 'Başarımlar', icon: Award },
      ...(isOwnProfile ? [{ id: 'settings', label: 'Ayarlar', icon: Settings }] : [])
    ];

    return (
      <div className="flex space-x-1 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      <QuickStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Son Aktiviteler
            </h3>
            <Link 
              to={`${isOwnProfile ? '/profile' : `/users/${username}`}/activity`} 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Tümünü Gör <ChevronRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {/* Sample activity items */}
            <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <p className="text-sm text-gray-900 dark:text-white">Cyberpunk 2077 oyununu puanladı</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 saat önce</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-sm text-gray-900 dark:text-white">Yeni kılavuz oluşturdu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 gün önce</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Achievements */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            İlerleme & Başarımlar
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Level İlerlemesi</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Level {userStats?.level || 1}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(((userStats?.totalXP || 0) % 1000) / 10, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sonraki level için {1000 - ((userStats?.totalXP || 0) % 1000)} XP
              </p>
            </div>

            {/* Email Verification Warning */}
            {isOwnProfile && currentUser && !currentUser.isEmailVerified && (
              <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Email Adresinizi Onaylayın
                      </h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                        Hesabınızın güvenliği için email adresinizi onaylamanız gerekiyor.
                      </p>
                      <button
                        onClick={() => {
                          // Send verification email API call
                          apiService.auth.sendVerificationEmail()
                            .then(() => toast.success('Doğrulama emaili gönderildi'))
                            .catch(() => toast.error('Email gönderilirken hata oluştu'));
                        }}
                        className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors"
                      >
                        Doğrulama Emaili Gönder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Son Başarımlar</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">İlk Oyun Puanı</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">İlk oyununuzu puanladınız</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserCard />
        <NavigationTabs />

        {/* Tab Content */}
        {activeTab === 'dashboard' && <DashboardContent />}
        
        {activeTab === 'settings' && isOwnProfile && (
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Hesap Ayarları</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Bilgileri</h3>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn-primary w-full"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Profili Düzenle
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Güvenlik</h3>
                  <button className="btn-secondary w-full mb-3">
                    Şifre Değiştir
                  </button>
                  <button className="btn-secondary w-full">
                    İki Faktörlü Doğrulama
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Games tab - Oyun Durumları */}
        {activeTab === 'games' && <GameStatusContent userId={user.id} />}

        {/* Other tab contents would go here */}
        {activeTab !== 'dashboard' && activeTab !== 'settings' && activeTab !== 'games' && (
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-12 shadow-lg border border-gray-200 dark:border-dark-700 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Bu bölüm geliştiriliyor
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab} bölümü yakında eklenecek.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profili Düzenle
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                    defaultValue={user.firstName || ''}
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
                    defaultValue={user.lastName || ''}
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
                  defaultValue={user.bio || ''}
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
                  defaultValue={user.location || ''}
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
                  defaultValue={user.website || ''}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
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

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportUser}
          isLoading={isReporting}
          targetName={`@${user?.username || 'Bu kullanıcı'}`}
        />
      )}
    </div>
  );
};

// GameStatusContent Component  
const GameStatusContent: React.FC<{ userId: number }> = ({ userId }) => {
  const [filter, setFilter] = React.useState<GameListType | 'all'>('all');
  
  // Fetch user's game statuses
  const { data: gameStatuses, isLoading } = useQuery({
    queryKey: ['userGameStatuses', userId, filter],
    queryFn: async () => {
      if (filter === 'all') {
        return await apiService.userGameStatus.getUserGameStatuses(userId);
      } else {
        return await apiService.userGameStatus.getGamesByStatus(userId, filter);
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const statusDisplayMap: Record<GameListType, { label: string; emoji: string; color: string }> = {
    [GameListType.Oynadim]: { label: 'Oynadım', emoji: '🏆', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    [GameListType.Oynamadim]: { label: 'Oynamadım', emoji: '👀', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
    [GameListType.Oynuyorum]: { label: 'Oynuyorum', emoji: '🎮', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    [GameListType.Oynayacagim]: { label: 'Oynayacağım', emoji: '⏰', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
    [GameListType.Oynamam]: { label: 'Oynamam', emoji: '🛑', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    [GameListType.Biraktim]: { label: 'Bıraktım', emoji: '📋', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
  };

  const filterOptions = [
    { value: 'all', label: 'Tüm Oyunlar', count: gameStatuses?.length || 0 },
    ...Object.entries(statusDisplayMap).map(([key, value]) => ({
      value: parseInt(key) as GameListType,
      label: value.label,
      count: gameStatuses?.filter(gs => gs.status === parseInt(key)).length || 0
    }))
  ];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-dark-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Oyun Durumları</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as GameListType | 'all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {/* Games List */}
      {!gameStatuses || gameStatuses.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Henüz oyun durumu yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Oyun sayfalarından oyun durumlarını işaretleyebilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gameStatuses
            .filter(gs => filter === 'all' || gs.status === filter)
            .map((gameStatus) => {
              const statusInfo = statusDisplayMap[gameStatus.status as GameListType];
              return (
                <Link
                  key={gameStatus.id}
                  to={`/games/${gameStatus.gameId}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Game Image Placeholder */}
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {gameStatus.game?.name || `Game ${gameStatus.gameId}`}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(gameStatus.createdDate).toLocaleDateString('tr-TR')} tarihinde eklendi
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.emoji} {statusInfo.label}
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;