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
  Calendar,
  MapPin,
  Link as LinkIcon,
  Mail,
  Activity,
  Award,
  TrendingUp,
  Users,
  Heart,
  Target,
  Shield,
  Crown,
  ChevronRight,
  Grid,
  List,
  Lock,
  Zap,
  Clock,
  Eye,
  ThumbsUp,
  Filter
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { User as UserType, UserRole, GameListType, UserGameStatus, FavoriteType, Favorite } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
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
  dislikesReceived: number;
  joinDate: string;
  lastActivity: string;
}

interface GameRating {
  id: number;
  gameId: number;
  game?: {
    id: number;
    name: string;
    coverImageUrl?: string;
  };
  rating: number;
  review?: string;
  createdDate: string;
}

// Forum Posts Tab Component
const ForumPostsTab: React.FC<{ isOwnProfile: boolean; userId: number }> = ({ isOwnProfile, userId }) => {
  const { data: forumPosts, isLoading } = useQuery({
    queryKey: ['user-forum-posts', userId],
    queryFn: () => apiService.users.getForumPosts(userId),
    enabled: !!userId,
    retry: false
  });

  // Debug: API'den gelen verileri kontrol et
  React.useEffect(() => {
    if (forumPosts && forumPosts.length > 0) {
      console.log('Forum Posts Data:', forumPosts[0]);
    }
  }, [forumPosts]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Forum postları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Forum Postlarım
          </h2>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
            {forumPosts?.length || 0} post
          </span>
        </div>
        
        {isOwnProfile && (
          <Link
            to="/forum/create"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Yeni Post
          </Link>
        )}
      </div>
        
      {forumPosts && forumPosts.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {forumPosts.map((post: any, index: number) => (
              <Link 
                key={post.id}
                to={post.slug ? `/forum/${post.slug}` : `/forum/topic/${post.id}`}
                className={`flex items-center p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
                  index === 0 ? 'rounded-t-xl' : ''
                } ${index === forumPosts.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4 shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate flex-1 min-w-0">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {post.forumCategory && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                          {post.forumCategory.name}
                        </span>
                      )}
                      {post.game && (
                        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                          🎮 {post.game.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(post.createdDate).toLocaleDateString('tr-TR')}</span>
                    <span>{post.viewCount} görüntüleme</span>
                    <span>{post.replyCount || 0} yanıt</span>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/forum/edit/${post.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700/50 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Düzenle
                    </Link>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-700/50 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <X className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Henüz forum postu yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isOwnProfile ? 'İlk forum postunuzu oluşturun ve toplulukla etkileşime geçin.' : 'Bu kullanıcının henüz forum postu bulunmuyor.'}
          </p>
          {isOwnProfile && (
            <Link
              to="/forum/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              İlk Postumu Oluştur
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// Blogs Tab Component
const BlogsTab: React.FC<{ isOwnProfile: boolean; userId: number }> = ({ isOwnProfile, userId }) => {
  const { data: blogs, isLoading } = useQuery({
    queryKey: ['user-blogs', userId],
    queryFn: () => apiService.users.getBlogs(userId),
    enabled: !!userId,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Blog yazıları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Blog Yazılarım
          </h2>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
            {blogs?.length || 0} yazı
          </span>
        </div>
        
        {isOwnProfile && (
          <Link
            to="/blogs/create"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Yeni Blog
          </Link>
        )}
      </div>
        
      {blogs && blogs.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {blogs.map((blog: any, index: number) => (
              <Link 
                key={blog.id}
                to={blog.slug ? `/blog/${blog.slug}` : `/blogs/${blog.id}`}
                className={`flex items-center p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
                  index === 0 ? 'rounded-t-xl' : ''
                } ${index === blogs.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                  {blog.coverImageUrl || blog.thumbnailUrl ? (
                    <img 
                      src={blog.coverImageUrl || blog.thumbnailUrl} 
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate flex-1 min-w-0">
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {blog.category && (
                        <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium">
                          📝 {blog.category.name}
                        </span>
                      )}
                      {blog.game && (
                        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                          🎮 {blog.game.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {blog.summary || blog.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(blog.createdDate).toLocaleDateString('tr-TR')}</span>
                    <span>{blog.viewCount} görüntüleme</span>
                    <span>{blog.likeCount || 0} beğeni</span>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/blogs/edit/${blog.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700/50 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Düzenle
                    </Link>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-700/50 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <X className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Henüz blog yazısı yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isOwnProfile ? 'İlk blog yazınızı oluşturun ve düşüncelerinizi paylaşın.' : 'Bu kullanıcının henüz blog yazısı bulunmuyor.'}
          </p>
          {isOwnProfile && (
            <Link
              to="/blogs/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              İlk Blog Yazımı Oluştur
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// Guides Tab Component
const GuidesTab: React.FC<{ isOwnProfile: boolean; userId: number }> = ({ isOwnProfile, userId }) => {
  const { data: guides, isLoading } = useQuery({
    queryKey: ['user-guides', userId],
    queryFn: () => apiService.users.getGuides(userId),
    enabled: !!userId,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Kılavuzlar yükleniyor...</p>
      </div>
    );
  }

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
            Kılavuzlarım
          </h2>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
            {guides?.length || 0} kılavuz
          </span>
        </div>
        
        {isOwnProfile && (
          <Link
            to="/guides/create"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg font-medium transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Yeni Kılavuz
          </Link>
        )}
      </div>
        
      {guides && guides.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {guides.map((guide: any, index: number) => (
              <Link 
                key={guide.id}
                to={guide.slug ? `/guide/${guide.slug}` : `/guides/${guide.id}`}
                className={`flex items-center p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
                  index === 0 ? 'rounded-t-xl' : ''
                } ${index === guides.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                  {guide.coverImageUrl || guide.thumbnailUrl ? (
                    <img 
                      src={guide.coverImageUrl || guide.thumbnailUrl} 
                      alt={guide.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate flex-1 min-w-0">
                      {guide.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {guide.difficulty && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getDifficultyColor(guide.difficulty)}`}>
                          ⭐ {guide.difficulty}
                        </span>
                      )}
                      {guide.guideCategory && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                          📚 {guide.guideCategory.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {guide.summary || guide.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(guide.createdDate).toLocaleDateString('tr-TR')}</span>
                    <span>{guide.viewCount} görüntüleme</span>
                    <span>{guide.likeCount || 0} beğeni</span>
                    {guide.game && (
                      <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                        🎮 {guide.game.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {isOwnProfile && (
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/guides/edit/${guide.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700/50 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Düzenle
                    </Link>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-700/50 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <X className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Henüz kılavuz yok
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isOwnProfile ? 'İlk kılavuzunuzu oluşturun ve bilginizi paylaşın.' : 'Bu kullanıcının henüz kılavuzu bulunmuyor.'}
          </p>
          {isOwnProfile && (
            <Link
              to="/guides/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              İlk Kılavuzumu Oluştur
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

// Favorites Tab Component
const FavoritesTab: React.FC<{ isOwnProfile: boolean; userId: number }> = ({ isOwnProfile, userId }) => {
  const [activeSubTab, setActiveSubTab] = useState<FavoriteType | 'all'>('all');
  const [favoritesWithTitles, setFavoritesWithTitles] = useState<(Favorite & { title?: string })[]>([]);

  // Fetch user's favorites
  const { data: allFavorites, isLoading } = useQuery({
    queryKey: ['userFavorites', userId],
    queryFn: () => apiService.favorites.getUserFavorites(userId),
    enabled: !!userId
  });

  // Fetch titles for each favorite
  React.useEffect(() => {
    if (!allFavorites || allFavorites.length === 0) {
      setFavoritesWithTitles([]);
      return;
    }

    const fetchTitles = async () => {
      const favoritesWithTitlesTemp = await Promise.all(
        allFavorites.map(async (favorite) => {
          try {
            let title = '';
            switch (favorite.favoriteType) {
              case FavoriteType.Game:
                const game = await apiService.games.getById(favorite.targetEntityId);
                title = game.name;
                break;
              case FavoriteType.ForumTopic:
                const forumTopic = await apiService.forum.getTopicById(favorite.targetEntityId);
                title = forumTopic.title;
                break;
              case FavoriteType.Guide:
                const guide = await apiService.guides.getById(favorite.targetEntityId);
                title = guide.title;
                break;
              case FavoriteType.BlogPost:
                const blog = await apiService.blogs.getById(favorite.targetEntityId);
                title = blog.title;
                break;
              default:
                title = `${getFavoriteTypeName(favorite.favoriteType)} #${favorite.targetEntityId}`;
            }
            return { ...favorite, title };
          } catch (error) {
            // If API call fails, fallback to ID display
            return { ...favorite, title: `${getFavoriteTypeName(favorite.favoriteType)} #${favorite.targetEntityId}` };
          }
        })
      );
      setFavoritesWithTitles(favoritesWithTitlesTemp);
    };

    fetchTitles();
  }, [allFavorites]);

  // Filter favorites by type
  const favoritesByType = {
    [FavoriteType.Game]: favoritesWithTitles?.filter(f => f.favoriteType === FavoriteType.Game) || [],
    [FavoriteType.ForumTopic]: favoritesWithTitles?.filter(f => f.favoriteType === FavoriteType.ForumTopic) || [],
    [FavoriteType.Guide]: favoritesWithTitles?.filter(f => f.favoriteType === FavoriteType.Guide) || [],
    [FavoriteType.BlogPost]: favoritesWithTitles?.filter(f => f.favoriteType === FavoriteType.BlogPost) || []
  };

  const subTabs = [
    { id: 'all' as const, label: 'Tüm Favoriler', icon: Heart, count: favoritesWithTitles?.length || 0 },
    { id: FavoriteType.Game, label: 'Oyunlar', icon: Gamepad2, count: favoritesByType[FavoriteType.Game].length },
    { id: FavoriteType.ForumTopic, label: 'Forum Konuları', icon: MessageSquare, count: favoritesByType[FavoriteType.ForumTopic].length },
    { id: FavoriteType.Guide, label: 'Kılavuzlar', icon: BookOpen, count: favoritesByType[FavoriteType.Guide].length },
    { id: FavoriteType.BlogPost, label: 'Blog Yazıları', icon: BookOpen, count: favoritesByType[FavoriteType.BlogPost].length }
  ];

  const getFavoriteTypeName = (type: FavoriteType): string => {
    switch (type) {
      case FavoriteType.Game: return 'Oyun';
      case FavoriteType.ForumTopic: return 'Forum Konusu';
      case FavoriteType.Guide: return 'Kılavuz';
      case FavoriteType.BlogPost: return 'Blog Yazısı';
      default: return 'İçerik';
    }
  };

  const getFavoriteIcon = (type: FavoriteType) => {
    switch (type) {
      case FavoriteType.Game: return <Gamepad2 className="w-5 h-5 text-blue-500" />;
      case FavoriteType.ForumTopic: return <MessageSquare className="w-5 h-5 text-green-500" />;
      case FavoriteType.Guide: return <BookOpen className="w-5 h-5 text-purple-500" />;
      case FavoriteType.BlogPost: return <BookOpen className="w-5 h-5 text-orange-500" />;
      default: return <Heart className="w-5 h-5 text-red-500" />;
    }
  };

  const getFavoriteUrl = (favorite: Favorite): string => {
    switch (favorite.favoriteType) {
      case FavoriteType.Game: return `/games/${favorite.targetEntityId}`;
      case FavoriteType.ForumTopic: return `/forum/topic/${favorite.targetEntityId}`;
      case FavoriteType.Guide: return `/guides/${favorite.targetEntityId}`;
      case FavoriteType.BlogPost: return `/blogs/${favorite.targetEntityId}`;
      default: return '#';
    }
  };

  const getFavoriteTypeColor = (type: FavoriteType): string => {
    switch (type) {
      case FavoriteType.Game: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case FavoriteType.ForumTopic: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case FavoriteType.Guide: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case FavoriteType.BlogPost: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Favoriler yükleniyor...</p>
      </div>
    );
  }

  const filteredFavorites = activeSubTab === 'all' 
    ? favoritesWithTitles || []
    : (activeSubTab in favoritesByType ? favoritesByType[activeSubTab as keyof typeof favoritesByType] : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isOwnProfile ? 'Favorilerim' : 'Favorileri'}
        </h2>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSubTab === tab.id
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Favorites List */}
      {!filteredFavorites || filteredFavorites.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {activeSubTab === 'all' ? 'Henüz favori yok' : `Henüz ${subTabs.find(t => t.id === activeSubTab)?.label.toLowerCase()} favorisi yok`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isOwnProfile 
              ? 'Beğendiğin içerikleri favorilerine ekleyebilirsin.'
              : 'Bu kullanıcının henüz favorisi bulunmuyor.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            {filteredFavorites.map((favorite) => (
              <Link
                key={favorite.id}
                to={getFavoriteUrl(favorite)}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    {getFavoriteIcon(favorite.favoriteType)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {(favorite as any).title || `${getFavoriteTypeName(favorite.favoriteType)} #${favorite.targetEntityId}`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(favorite.createdDate).toLocaleDateString('tr-TR')} tarihinde eklendi
                    </p>
                  </div>
                </div>

                {/* Type Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getFavoriteTypeColor(favorite.favoriteType)}`}>
                  {getFavoriteTypeName(favorite.favoriteType)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NewProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser, updateProfile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const queryClient = useQueryClient();

  const isOwnProfile = !username || username === currentUser?.username;
  const profileUserId = isOwnProfile ? currentUser?.id : undefined;

  // Email cooldown logic
  useEffect(() => {
    const checkCooldown = () => {
      const lastSentTime = localStorage.getItem('lastEmailVerificationSent');
      if (lastSentTime) {
        const timeElapsed = Date.now() - parseInt(lastSentTime);
        const cooldownTime = 5 * 60 * 1000; // 5 minutes in ms
        if (timeElapsed < cooldownTime) {
          const remainingTime = Math.ceil((cooldownTime - timeElapsed) / 1000);
          setEmailCooldown(remainingTime);
        }
      }
    };

    checkCooldown();
  }, []);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailCooldown > 0) {
      interval = setInterval(() => {
        setEmailCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailCooldown]);

  const handleSendVerificationEmail = async () => {
    if (emailCooldown > 0 || isEmailSending) return;

    setIsEmailSending(true);
    try {
      await apiService.auth.sendVerificationEmail();
      localStorage.setItem('lastEmailVerificationSent', Date.now().toString());
      setEmailCooldown(300); // 5 minutes in seconds
      toast.success('Doğrulama emaili gönderildi! Gelen kutunuzu kontrol edin.');
    } catch (error) {
      toast.error('Email gönderilirken hata oluştu');
    } finally {
      setIsEmailSending(false);
    }
  };

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
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['user-stats', profileUserId],
    queryFn: () => apiService.users.getStats(profileUserId!),
    enabled: !!profileUserId,
    retry: false,
    refetchOnMount: true
  });

  // Fetch user's game ratings
  const { data: gameRatings } = useQuery({
    queryKey: ['user-game-ratings', profileUserId],
    queryFn: () => apiService.users.getGameRatings(profileUserId!),
    enabled: !!profileUserId && activeTab === 'games',
    retry: false
  });


  const user = profileUser || currentUser;

  const onSubmit = async (data: ProfileFormData) => {
    if (!isOwnProfile) return;
    
    try {
      await updateProfile(data);
      toast.success('Profil başarıyla güncellendi');
      setIsEditing(false);
      queryClient.invalidateQueries(['user-profile']);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR');
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
        return 'User';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 25) return 'from-blue-500 to-cyan-500';
    if (level >= 10) return 'from-green-500 to-emerald-500';
    return 'from-gray-400 to-gray-500';
  };

  // Component definitions
  const ProfileHeader = () => (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-800 dark:from-indigo-700 dark:to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl text-white font-bold border-4 border-white/30 shadow-2xl overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.charAt(0).toUpperCase()
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
                {user?.firstName || user?.lastName 
                  ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
                  : user?.username}
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                {user?.role && getRoleIcon(user.role)}
                <span className="text-sm px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30">
                  @{user?.username}
                </span>
                <span className="text-sm px-3 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/30">
                  {user?.role && getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>

            {user?.bio && (
              <p className="text-indigo-100 text-lg mb-6 max-w-2xl drop-shadow">
                {user.bio}
              </p>
            )}

            {/* User Meta Info */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-indigo-100 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(user?.createdAt || '')} tarihinde katıldı</span>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Son aktivite: {formatRelativeTime(user?.lastLoginAt || user?.createdAt || '')}</span>
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

            {/* Email Verification Warning */}
            {isOwnProfile && currentUser && !currentUser.isEmailVerified && (
              <div className="mt-6 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                      <Mail className="w-6 h-6 text-yellow-900" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Email Adresinizi Onaylayın
                    </h4>
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                      Hesabınızın güvenliği ve tüm özelliklere erişim için email adresinizi onaylamanız gerekiyor.
                    </p>
                    <button
                      onClick={handleSendVerificationEmail}
                      disabled={emailCooldown > 0 || isEmailSending}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors shadow-md ${
                        emailCooldown > 0 || isEmailSending
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      {isEmailSending ? (
                        <>
                          <div className="inline-block w-4 h-4 border-2 border-yellow-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Gönderiliyor...
                        </>
                      ) : emailCooldown > 0 ? (
                        <>
                          Tekrar gönder ({Math.floor(emailCooldown / 60)}:{(emailCooldown % 60).toString().padStart(2, '0')})
                        </>
                      ) : (
                        'Doğrulama Emaili Gönder'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="flex flex-col gap-3">
              <Link
                to="/friends"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/30 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Arkadaş Yönetimi
              </Link>
              <Link
                to="/settings"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/30 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Ayarlar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const NavigationTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Genel Bakış', icon: TrendingUp },
      { id: 'posts', label: 'Forum Postlarım', icon: MessageSquare },
      { id: 'blogs', label: 'Bloglarım', icon: BookOpen },
      { id: 'guides', label: 'Kılavuzlarım', icon: BookOpen },
      { id: 'games', label: 'Oyun Durumları', icon: Gamepad2 },
      { id: 'favorites', label: 'Favorilerim', icon: Heart },
      { id: 'achievements', label: 'Başarımlar', icon: Trophy },
    ];

    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
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

          {/* 3. Yazılan Yorum */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{userStats.commentsCount || 0}</span>
            </div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400">Yazılan Yorum</h4>
            <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">Toplam yorum sayısı</p>
          </div>

          {/* 4. Üyelik Süresi */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700/50">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {userStats?.joinDate ? Math.floor((new Date().getTime() - new Date(userStats.joinDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}
              </span>
            </div>
            <h4 className="font-medium text-purple-600 dark:text-purple-400">Üyelik Süresi</h4>
            <p className="text-sm text-purple-500 dark:text-purple-400 mt-1">Toplam gün sayısı</p>
          </div>

          {/* 5. Oyun Puanları */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700/50">
            <div className="flex items-center justify-between mb-3">
              <Star className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">{userStats.gamesRated || 0}</span>
            </div>
            <h4 className="font-medium text-orange-600 dark:text-orange-400">Oyun Puanları</h4>
            <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">Puanlanan oyun sayısı</p>
          </div>

          {/* 6. Forum Konuları */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-700/50">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{userStats.forumTopics || 0}</span>
            </div>
            <h4 className="font-medium text-emerald-600 dark:text-emerald-400">Forum Konuları</h4>
            <p className="text-sm text-emerald-500 dark:text-emerald-400 mt-1">Oluşturulan konu sayısı</p>
          </div>

          {/* 7. Kılavuzlar */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-6 rounded-2xl border border-cyan-200 dark:border-cyan-700/50">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="w-8 h-8 text-cyan-600" />
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{userStats.guidesCreated || 0}</span>
            </div>
            <h4 className="font-medium text-cyan-600 dark:text-cyan-400">Kılavuzlar</h4>
            <p className="text-sm text-cyan-500 dark:text-cyan-400 mt-1">Yazılan kılavuz sayısı</p>
          </div>

          {/* 8. Blog Yazıları */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-6 rounded-2xl border border-pink-200 dark:border-pink-700/50">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="w-8 h-8 text-pink-600" />
              <span className="text-2xl font-bold text-pink-700 dark:text-pink-300">{userStats.blogPosts || 0}</span>
            </div>
            <h4 className="font-medium text-pink-600 dark:text-pink-400">Blog Yazıları</h4>
            <p className="text-sm text-pink-500 dark:text-pink-400 mt-1">Yazılan blog sayısı</p>
          </div>
        </div>
      )}
    </div>
  );

  const GameStatusTab: React.FC<{ userId: number }> = ({ userId }) => {
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'oynadim' | 'oynamadim' | 'oynuyorum' | 'oynayacagim' | 'oynamam' | 'biraktim'>('all');
    
    const { data: gameStatuses, isLoading } = useQuery({
      queryKey: ['user-game-statuses', userId],
      queryFn: () => apiService.users.getGameStatuses(userId),
      enabled: !!userId,
      retry: false
    });

    // Debug: API'den gelen verileri kontrol et
    React.useEffect(() => {
      if (gameStatuses && gameStatuses.length > 0) {
        console.log('Game Statuses Data:', gameStatuses[0]);
      }
    }, [gameStatuses]);

    if (isLoading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Oyun durumları yükleniyor...</p>
        </div>
      );
    }

    // Filter game statuses by type
    const statusesByType = {
      oynadim: gameStatuses?.filter(status => status.status === 1) || [], // Oynadım
      oynamadim: gameStatuses?.filter(status => status.status === 2) || [], // Oynamadım
      oynuyorum: gameStatuses?.filter(status => status.status === 3) || [], // Oynuyorum
      oynayacagim: gameStatuses?.filter(status => status.status === 4) || [], // Oynayacağım
      oynamam: gameStatuses?.filter(status => status.status === 5) || [], // Oynamam
      biraktim: gameStatuses?.filter(status => status.status === 6) || [] // Bıraktım
    };

    const subTabs = [
      { id: 'all' as const, label: 'Tümü', icon: Gamepad2, count: gameStatuses?.length || 0, color: 'bg-slate-100 dark:bg-slate-700' },
      { id: 'oynuyorum' as const, label: 'Oynuyorum', icon: Zap, count: statusesByType.oynuyorum.length, color: 'bg-green-100 dark:bg-green-900/30' },
      { id: 'oynadim' as const, label: 'Oynadım', icon: Target, count: statusesByType.oynadim.length, color: 'bg-blue-100 dark:bg-blue-900/30' },
      { id: 'oynayacagim' as const, label: 'Oynayacağım', icon: Clock, count: statusesByType.oynayacagim.length, color: 'bg-orange-100 dark:bg-orange-900/30' },
      { id: 'oynamadim' as const, label: 'Oynamadım', icon: Eye, count: statusesByType.oynamadim.length, color: 'bg-purple-100 dark:bg-purple-900/30' },
      { id: 'oynamam' as const, label: 'Oynamam', icon: X, count: statusesByType.oynamam.length, color: 'bg-red-100 dark:bg-red-900/30' },
      { id: 'biraktim' as const, label: 'Bıraktım', icon: Filter, count: statusesByType.biraktim.length, color: 'bg-gray-100 dark:bg-gray-900/30' }
    ];

    const getStatusColor = (status: number) => {
      switch (status) {
        case 1: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'; // Oynadım
        case 2: return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'; // Oynamadım
        case 3: return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'; // Oynuyorum
        case 4: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'; // Oynayacağım
        case 5: return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'; // Oynamam
        case 6: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'; // Bıraktım
        default: return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
      }
    };

    const getStatusLabel = (status: number) => {
      switch (status) {
        case 1: return '🏆 Oynadım';
        case 2: return '👀 Oynamadım';
        case 3: return '🎮 Oynuyorum';
        case 4: return '⏰ Oynayacağım';
        case 5: return '🛑 Oynamam';
        case 6: return '📋 Bıraktım';
        default: return '❓ Bilinmiyor';
      }
    };

    const filteredStatuses = activeSubTab === 'all' 
      ? gameStatuses || []
      : statusesByType[activeSubTab] || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Oyun Durumları
          </h2>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeSubTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Game Statuses List */}
        {!filteredStatuses || filteredStatuses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
            <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeSubTab === 'all' ? 'Henüz oyun durumu yok' : `Henüz ${subTabs.find(t => t.id === activeSubTab)?.label.toLowerCase()} oyun yok`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Oyunları listelere ekleyerek oyun deneyimini takip edebilirsin.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStatuses.map((status: any, index: number) => (
                <div 
                  key={status.id}
                  className={`flex items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    index === 0 ? 'rounded-t-2xl' : ''
                  } ${index === filteredStatuses.length - 1 ? 'rounded-b-2xl' : ''}`}
                >
                  {/* Game Cover Image */}
                  <div className="w-20 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-5 shrink-0 overflow-hidden shadow-md">
                    {status.game?.coverImageUrl || status.game?.coverUrl ? (
                      <img 
                        src={status.game.coverImageUrl || status.game.coverUrl} 
                        alt={status.game.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '';
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-8 h-8 text-white"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="2" x2="6" y2="6"></line><line x1="18" y1="2" x2="18" y2="6"></line><line x1="6" y1="10" x2="18" y2="10"></line><rect x="6" y="14" width="12" height="8" rx="2"></rect></svg></div>';
                        }}
                      />
                    ) : (
                      <Gamepad2 className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  {/* Game Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">
                          {status.game?.name || 'Bilinmeyen Oyun'}
                        </h3>
                        
                        {status.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {status.notes}
                          </p>
                        )}
                        
                        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>📅 {new Date(status.createdDate || status.updatedDate).toLocaleDateString('tr-TR')} tarihinde eklendi</span>
                          {status.updatedDate !== status.createdDate && (
                            <span>🔄 Son güncelleme: {new Date(status.updatedDate).toLocaleDateString('tr-TR')}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge - Right Side */}
                      <div className="ml-4 flex flex-col items-end">
                        <span className={`px-3 py-2 rounded-lg text-sm font-semibold shadow-sm ${getStatusColor(status.status)}`}>
                          {getStatusLabel(status.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <ProfileHeader />
      
      {/* Navigation */}
      <NavigationTabs />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'posts' && user?.id && <ForumPostsTab isOwnProfile={isOwnProfile} userId={user.id} />}
        {activeTab === 'blogs' && user?.id && <BlogsTab isOwnProfile={isOwnProfile} userId={user.id} />}
        {activeTab === 'guides' && user?.id && <GuidesTab isOwnProfile={isOwnProfile} userId={user.id} />}
        {activeTab === 'games' && user?.id && <GameStatusTab userId={user.id} />}
        {activeTab === 'favorites' && user?.id && <FavoritesTab isOwnProfile={isOwnProfile} userId={user.id} />}
        
        {activeTab === 'achievements' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Başarımlar Geliştiriliyor
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Başarım sistemi yakında aktif olacak.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profili Düzenle
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad
                  </label>
                  <input
                    {...register('firstName')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Adınız"
                    defaultValue={user?.firstName || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soyad
                  </label>
                  <input
                    {...register('lastName')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Soyadınız"
                    defaultValue={user?.lastName || ''}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                  placeholder="Kendiniz hakkında kısa bilgi..."
                  defaultValue={user?.bio || ''}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
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

export default NewProfilePage;