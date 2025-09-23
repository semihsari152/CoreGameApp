import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Gamepad2, 
  MessageSquare, 
  BookOpen, 
  PenTool, 
  Flag, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Shield,
  Crown,
  BarChart3,
  Calendar,
  Eye
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const canAccessAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Moderator;

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.admin.getDashboardStats(),
    enabled: canAccessAdmin
  });

  // Fetch recent activities
  const { data: activities } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: () => api.admin.getRecentActivities({ limit: 10 }),
    enabled: canAccessAdmin
  });

  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Yetki Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfayı görüntülemek için admin veya moderatör yetkisine sahip olmalısınız.
          </p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statCards = [
    {
      title: 'Toplam Kullanıcılar',
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users'
    },
    {
      title: 'Toplam Oyunlar',
      value: stats?.totalGames || 0,
      change: stats?.gameGrowth || 0,
      icon: Gamepad2,
      color: 'bg-green-500',
      link: '/games'
    },
    {
      title: 'Forum Konuları',
      value: stats?.totalTopics || 0,
      change: stats?.topicGrowth || 0,
      icon: MessageSquare,
      color: 'bg-purple-500',
      link: '/forum'
    },
    {
      title: 'Kılavuzlar',
      value: stats?.totalGuides || 0,
      change: stats?.guideGrowth || 0,
      icon: BookOpen,
      color: 'bg-orange-500',
      link: '/guides'
    },
    {
      title: 'Blog Yazıları',
      value: stats?.totalBlogs || 0,
      change: stats?.blogGrowth || 0,
      icon: PenTool,
      color: 'bg-pink-500',
      link: '/blog'
    },
    {
      title: 'Bekleyen Raporlar',
      value: stats?.pendingReports || 0,
      change: 0,
      icon: Flag,
      color: 'bg-red-500',
      link: '/admin/reports',
      urgent: (stats?.pendingReports || 0) > 0
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-gaming font-bold text-gray-900 dark:text-white flex items-center">
                <Crown className="w-8 h-8 mr-3 text-yellow-600" />
                Admin Paneli
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Sistem yönetimi ve moderasyon merkezi
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Hoş geldin, {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role} • {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              to={stat.link}
              className={`card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                stat.urgent ? 'ring-2 ring-red-500 ring-opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(stat.value)}
                  </p>
                  {stat.change !== 0 && (
                    <div className={`flex items-center mt-2 text-sm ${
                      stat.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`w-4 h-4 mr-1 ${
                        stat.change < 0 ? 'rotate-180' : ''
                      }`} />
                      <span>{Math.abs(stat.change)}% bu ay</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Son Aktiviteler
              </h2>
              <Link
                to="/admin/activities"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
              >
                Tümünü Gör
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {activities?.data?.slice(0, 8).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user?.username}</span>
                        <span className="text-gray-600 dark:text-gray-400"> {activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {(!activities?.data || activities.data.length === 0) && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Henüz aktivite bulunmuyor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* System Health */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Sistem Durumu
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Sunucu Durumu
                  </span>
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Çevrimiçi
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Veritabanı
                  </span>
                </div>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Sağlıklı
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Cache Sistemi
                  </span>
                </div>
                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  Uyarı
                </span>
              </div>

              {stats?.pendingReports && stats.pendingReports > 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Bekleyen Raporlar
                    </span>
                  </div>
                  <Link
                    to="/admin/reports"
                    className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline"
                  >
                    {stats.pendingReports} rapor
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Hızlı İşlemler
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="p-4 text-center hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Kullanıcı Yönetimi
              </span>
            </Link>
            <Link
              to="/admin/reports"
              className="p-4 text-center hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <Flag className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Rapor İnceleme
              </span>
            </Link>
            <Link
              to="/admin/analytics"
              className="p-4 text-center hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Analitik
              </span>
            </Link>
            <Link
              to="/admin/settings"
              className="p-4 text-center hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Sistem Ayarları
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;