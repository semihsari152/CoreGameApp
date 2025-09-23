import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { User as UserType, BlogPost, ForumTopic, Guide } from '../../types';
import { apiService } from '../../services/api';
import { formatRelativeTime, formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
  location?: string;
  website?: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userContent, setUserContent] = useState<{
    blogs: BlogPost[];
    guides: Guide[];
    topics: ForumTopic[];
    loading: boolean;
  }>({
    blogs: [],
    guides: [],
    topics: [],
    loading: false
  });
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || ''
    }
  });

  // Load user content
  const loadUserContent = async () => {
    if (!user?.id) return;

    setUserContent(prev => ({ ...prev, loading: true }));
    try {
      const [blogsResult, guidesResult, topicsResult] = await Promise.allSettled([
        // User's blogs
        apiService.blogs.getAll({ authorId: user.id }),
        // User's guides  
        apiService.guides.getByUser(user.id),
        // User's forum topics - assuming we have this endpoint
        apiService.forum.getTopics({ authorId: user.id })
      ]);

      setUserContent(prev => ({
        ...prev,
        blogs: blogsResult.status === 'fulfilled' ? (blogsResult.value.data || []) : [],
        guides: guidesResult.status === 'fulfilled' ? guidesResult.value : [],
        topics: topicsResult.status === 'fulfilled' ? (topicsResult.value.data || []) : [],
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load user content:', error);
      setUserContent(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadUserContent();
    }
  }, [user?.id]);

  const onSubmit = async (data: ProfileFormData) => {
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

  const formatDateLocal = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const stats = [
    { label: 'Toplam XP', value: user?.xp || 0, icon: Trophy, color: 'text-yellow-600' },
    { label: 'Blog Yazısı', value: userContent.blogs.length, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Forum Konusu', value: userContent.topics.length, icon: MessageSquare, color: 'text-green-600' },
    { label: 'Kılavuz', value: userContent.guides.length, icon: BookOpen, color: 'text-purple-600' },
  ];

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: User },
    { id: 'blogs', label: 'Blog Yazılarım', icon: BookOpen },
    { id: 'guides', label: 'Kılavuzlarım', icon: BookOpen },
    { id: 'forums', label: 'Forum Konularım', icon: MessageSquare },
    { id: 'games', label: 'Oyunlarım', icon: Gamepad2 },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Profile Header */}
      <div className="bg-gradient-gaming text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center transition-colors">
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-gaming font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-xl text-white/80">@{user.username}</p>
                  <p className="text-white/70 mt-1">
                    Üye olma: {formatDateLocal(user.createdAt)}
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Profili Düzenle
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isLoading}
                        className="btn bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="btn bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        İptal
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4">
                {isEditing ? (
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none"
                    placeholder="Kendiniz hakkında bir şeyler yazın..."
                  />
                ) : (
                  <p className="text-white/90 max-w-2xl">
                    {user.bio || 'Henüz bio eklenmemiş.'}
                  </p>
                )}
              </div>

              {/* Additional Info */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                {isEditing ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <input
                        {...register('location')}
                        className="bg-white/20 backdrop-blur-sm border border-white/30 rounded px-2 py-1 text-white placeholder-white/60"
                        placeholder="Konum"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4" />
                      <input
                        {...register('website')}
                        className="bg-white/20 backdrop-blur-sm border border-white/30 rounded px-2 py-1 text-white placeholder-white/60"
                        placeholder="Website"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center space-x-1">
                        <LinkIcon className="w-4 h-4" />
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                          {user.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Doğum: {user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 dark:border-dark-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Son Aktiviteler
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          "The Witcher 3" oyununu beğendi
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          2 saat önce
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Games */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Favori Oyunlar
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Gamepad2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Oyun {index + 1}
                      </p>
                      <div className="flex items-center justify-center mt-1">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">4.5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Oyun Koleksiyonum
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Oyun koleksiyonu yakında burada görüntülenecek.
              </p>
            </div>
          )}

          {activeTab === 'blogs' && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Blog Yazılarım
                </h3>
                <Link
                  to="/blog/create"
                  className="btn-primary text-sm"
                >
                  Yeni Blog Yazısı
                </Link>
              </div>
              {userContent.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : userContent.blogs.length > 0 ? (
                <div className="space-y-4">
                  {userContent.blogs.map((blog) => (
                    <div key={blog.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={`/blogs/${blog.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {blog.title}
                          </Link>
                          {blog.excerpt && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm line-clamp-2">
                              {blog.excerpt}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {blog.viewCount || 0} görüntülenme
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatRelativeTime(blog.createdAt)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Henüz blog yazısı yazmamışsınız.</p>
                  <Link
                    to="/blog/create"
                    className="btn-primary mt-4 inline-block"
                  >
                    İlk Blog Yazınızı Oluşturun
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guides' && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Yazdığım Kılavuzlar
                </h3>
                <Link
                  to="/guides/create"
                  className="btn-primary text-sm"
                >
                  Yeni Kılavuz
                </Link>
              </div>
              {userContent.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : userContent.guides.length > 0 ? (
                <div className="space-y-4">
                  {userContent.guides.map((guide) => (
                    <div key={guide.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={`/guides/${guide.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {guide.title}
                          </Link>
                          {guide.summary && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm line-clamp-2">
                              {guide.summary}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {guide.viewCount || 0} görüntülenme
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatRelativeTime(guide.createdAt)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/guides/${guide.id}/edit`)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Henüz kılavuz yazmamışsınız.</p>
                  <Link
                    to="/guides/create"
                    className="btn-primary mt-4 inline-block"
                  >
                    İlk Kılavuzunuzu Oluşturun
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'forums' && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Forum Konularım
                </h3>
                <Link
                  to="/forum/create"
                  className="btn-primary text-sm"
                >
                  Yeni Konu
                </Link>
              </div>
              {userContent.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : userContent.topics.length > 0 ? (
                <div className="space-y-4">
                  {userContent.topics.map((topic) => (
                    <div key={topic.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={`/forum/topic/${topic.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {topic.title}
                          </Link>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {topic.viewCount || 0} görüntülenme
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {topic.replyCount || 0} yanıt
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatRelativeTime(topic.createdAt)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/forum/topic/${topic.id}/edit`)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Henüz forum konusu oluşturmamışsınız.</p>
                  <Link
                    to="/forum/create"
                    className="btn-primary mt-4 inline-block"
                  >
                    İlk Forum Konunuzu Oluşturun
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Hesap Ayarları
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hesap ayarları yakında burada görüntülenecek.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;