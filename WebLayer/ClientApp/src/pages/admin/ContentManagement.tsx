import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  TrendingUp,
  MessageSquare,
  Heart,
  Flag,
  Globe,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminAuthService } from '../../services/admin/adminAuthService';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'draft' | 'published' | 'archived' | 'pending_review';
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  category?: string;
  tags: string[];
}

interface Guide {
  id: number;
  title: string;
  slug: string;
  description?: string;
  content: string;
  status: 'draft' | 'published' | 'archived' | 'pending_review';
  isPublic: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  gameId?: number;
  gameName?: string;
  category?: string;
  tags: string[];
}

type ContentType = 'blogs' | 'guides';

interface ContentFilters {
  search: string;
  status: string;
  category: string;
  author: string;
  isPublic: boolean | null;
}

export const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('blogs');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ContentFilters>({
    search: '',
    status: '',
    category: '',
    author: '',
    isPublic: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadContent();
  }, [activeTab, currentPage]);

  useEffect(() => {
    applyFilters();
  }, [blogs, guides, filters]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'blogs') {
        // Mock blog data
        const mockBlogs: BlogPost[] = [
          {
            id: 1,
            title: 'The Future of Gaming: VR and AR Technologies',
            slug: 'future-of-gaming-vr-ar',
            excerpt: 'Exploring the latest trends in virtual and augmented reality gaming...',
            content: 'Lorem ipsum dolor sit amet...',
            status: 'published',
            isPublic: true,
            viewCount: 1250,
            likeCount: 89,
            commentCount: 23,
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-12T15:30:00Z',
            publishedAt: '2024-01-12T15:30:00Z',
            author: {
              id: 1,
              username: 'editor1',
              firstName: 'John',
              lastName: 'Editor'
            },
            category: 'Technology',
            tags: ['VR', 'AR', 'Gaming', 'Technology']
          },
          {
            id: 2,
            title: 'Top 10 Indie Games of 2024',
            slug: 'top-10-indie-games-2024',
            excerpt: 'Discover the best independent games that defined this year...',
            content: 'Lorem ipsum dolor sit amet...',
            status: 'pending_review',
            isPublic: false,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            createdAt: '2024-01-15T14:20:00Z',
            updatedAt: '2024-01-15T14:20:00Z',
            author: {
              id: 2,
              username: 'gamer_writer',
              firstName: 'Jane',
              lastName: 'Smith'
            },
            category: 'Reviews',
            tags: ['Indie', 'Games', 'Reviews', '2024']
          },
          {
            id: 3,
            title: 'Gaming Industry Trends and Analysis',
            slug: 'gaming-industry-trends-analysis',
            excerpt: 'An in-depth look at current gaming market trends...',
            content: 'Lorem ipsum dolor sit amet...',
            status: 'draft',
            isPublic: false,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            createdAt: '2024-01-08T09:15:00Z',
            updatedAt: '2024-01-14T11:45:00Z',
            author: {
              id: 1,
              username: 'editor1',
              firstName: 'John',
              lastName: 'Editor'
            },
            category: 'Analysis',
            tags: ['Industry', 'Trends', 'Analysis']
          }
        ];
        setBlogs(mockBlogs);
      } else {
        // Mock guide data
        const mockGuides: Guide[] = [
          {
            id: 1,
            title: 'Complete Guide to Dark Souls III Boss Strategies',
            slug: 'dark-souls-iii-boss-strategies',
            description: 'Master every boss fight in Dark Souls III with detailed strategies...',
            content: 'Lorem ipsum dolor sit amet...',
            status: 'published',
            isPublic: true,
            difficulty: 'advanced',
            estimatedTime: 120,
            viewCount: 5420,
            likeCount: 234,
            commentCount: 67,
            createdAt: '2024-01-05T16:30:00Z',
            updatedAt: '2024-01-06T10:15:00Z',
            publishedAt: '2024-01-06T10:15:00Z',
            author: {
              id: 3,
              username: 'souls_master',
              firstName: 'Mike',
              lastName: 'Johnson'
            },
            gameId: 1,
            gameName: 'Dark Souls III',
            category: 'Boss Guides',
            tags: ['Dark Souls', 'Boss', 'Strategy', 'Advanced']
          },
          {
            id: 2,
            title: 'Minecraft Building Techniques for Beginners',
            slug: 'minecraft-building-techniques-beginners',
            description: 'Learn the basics of creating amazing structures in Minecraft...',
            content: 'Lorem ipsum dolor sit amet...',
            status: 'published',
            isPublic: true,
            difficulty: 'beginner',
            estimatedTime: 45,
            viewCount: 8930,
            likeCount: 412,
            commentCount: 89,
            createdAt: '2024-01-12T12:00:00Z',
            updatedAt: '2024-01-12T12:00:00Z',
            publishedAt: '2024-01-12T12:00:00Z',
            author: {
              id: 4,
              username: 'craft_builder',
              firstName: 'Sarah',
              lastName: 'Wilson'
            },
            gameId: 2,
            gameName: 'Minecraft',
            category: 'Building',
            tags: ['Minecraft', 'Building', 'Beginner', 'Tutorial']
          },
          {
            id: 3,
            title: 'Advanced PvP Strategies in Call of Duty',
            slug: 'advanced-pvp-strategies-cod',
            description: 'Take your Call of Duty gameplay to the next level...',
            content: 'Lorem ipsum dolor sit amet...',
            status: 'pending_review',
            isPublic: false,
            difficulty: 'advanced',
            estimatedTime: 90,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            createdAt: '2024-01-16T08:45:00Z',
            updatedAt: '2024-01-16T08:45:00Z',
            author: {
              id: 5,
              username: 'pro_gamer',
              firstName: 'Alex',
              lastName: 'Chen'
            },
            gameId: 3,
            gameName: 'Call of Duty: Modern Warfare',
            category: 'PvP',
            tags: ['Call of Duty', 'PvP', 'Strategy', 'Advanced']
          }
        ];
        setGuides(mockGuides);
      }
      
      setTotalPages(1);
    } catch (error: any) {
      toast.error('İçerik yüklenirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    const applyContentFilters = <T extends BlogPost | Guide>(items: T[]): T[] => {
      let filtered = [...items];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(item => 
          item.title.toLowerCase().includes(searchLower) ||
          item.author.username.toLowerCase().includes(searchLower) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }

      if (filters.status) {
        filtered = filtered.filter(item => item.status === filters.status);
      }

      if (filters.category) {
        filtered = filtered.filter(item => item.category === filters.category);
      }

      if (filters.author) {
        filtered = filtered.filter(item => 
          item.author.username.toLowerCase().includes(filters.author.toLowerCase())
        );
      }

      if (filters.isPublic !== null) {
        filtered = filtered.filter(item => item.isPublic === filters.isPublic);
      }

      return filtered;
    };

    setFilteredBlogs(applyContentFilters(blogs));
    setFilteredGuides(applyContentFilters(guides));
  };

  const handleStatusChange = async (id: number, newStatus: string, type: ContentType) => {
    try {
      if (type === 'blogs') {
        const updatedBlogs = blogs.map(blog =>
          blog.id === id ? { ...blog, status: newStatus as BlogPost['status'] } : blog
        );
        setBlogs(updatedBlogs);
      } else {
        const updatedGuides = guides.map(guide =>
          guide.id === id ? { ...guide, status: newStatus as Guide['status'] } : guide
        );
        setGuides(updatedGuides);
      }
      
      toast.success('Durum güncellendi');
    } catch (error: any) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (id: number, type: ContentType) => {
    if (!window.confirm('Bu içeriği silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      if (type === 'blogs') {
        setBlogs(blogs.filter(blog => blog.id !== id));
      } else {
        setGuides(guides.filter(guide => guide.id !== id));
      }
      
      toast.success('İçerik silindi');
    } catch (error: any) {
      toast.error('İçerik silinirken hata oluştu');
    }
  };

  const handleTogglePublic = async (id: number, type: ContentType) => {
    try {
      if (type === 'blogs') {
        const updatedBlogs = blogs.map(blog =>
          blog.id === id ? { ...blog, isPublic: !blog.isPublic } : blog
        );
        setBlogs(updatedBlogs);
      } else {
        const updatedGuides = guides.map(guide =>
          guide.id === id ? { ...guide, isPublic: !guide.isPublic } : guide
        );
        setGuides(updatedGuides);
      }
      
      toast.success('Görünürlük güncellendi');
    } catch (error: any) {
      toast.error('Görünürlük güncellenirken hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    const labels = {
      published: 'Yayınlandı',
      draft: 'Taslak',
      pending_review: 'İnceleme Bekliyor',
      archived: 'Arşivlendi'
    };

    return { class: badges[status as keyof typeof badges], label: labels[status as keyof typeof labels] };
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    const labels = {
      beginner: 'Başlangıç',
      intermediate: 'Orta',
      advanced: 'İleri'
    };

    return { class: badges[difficulty as keyof typeof badges], label: labels[difficulty as keyof typeof labels] };
  };

  if (!AdminAuthService.canManageContent()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Yetkisiz Erişim
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'blogs' ? filteredBlogs : filteredGuides;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            İçerik Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Blog yazıları ve rehberleri yönetin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'blogs'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Blog Yazıları ({filteredBlogs.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guides'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Rehberler ({filteredGuides.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="İçerik ara..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tüm Durumlar</option>
            <option value="published">Yayınlandı</option>
            <option value="draft">Taslak</option>
            <option value="pending_review">İnceleme Bekliyor</option>
            <option value="archived">Arşivlendi</option>
          </select>

          <input
            type="text"
            placeholder="Yazar ara..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.author}
            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
          />

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.isPublic === null ? '' : filters.isPublic.toString()}
            onChange={(e) => setFilters({ ...filters, isPublic: e.target.value === '' ? null : e.target.value === 'true' })}
          >
            <option value="">Tüm İçerikler</option>
            <option value="true">Herkese Açık</option>
            <option value="false">Gizli</option>
          </select>

          <button
            onClick={() => setFilters({ search: '', status: '', category: '', author: '', isPublic: null })}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {activeTab === 'blogs' ? (
              <FileText className="w-5 h-5 text-gray-500" />
            ) : (
              <BookOpen className="w-5 h-5 text-gray-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {activeTab === 'blogs' ? 'Blog Yazıları' : 'Rehberler'} ({currentData.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-8">
              {activeTab === 'blogs' ? (
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              ) : (
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              )}
              <p className="text-gray-500 dark:text-gray-400">İçerik bulunamadı</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Başlık
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Yazar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  {activeTab === 'guides' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Zorluk
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İstatistikler
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.title}
                              </div>
                              {item.isPublic ? (
                                <div title="Herkese açık">
                                  <Globe className="w-4 h-4 text-green-500" />
                                </div>
                              ) : (
                                <div title="Gizli">
                                  <Lock className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            {activeTab === 'guides' && 'gameName' in item && item.gameName && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {item.gameName}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{item.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.author.firstName && item.author.lastName 
                                ? `${item.author.firstName} ${item.author.lastName}`
                                : item.author.username
                              }
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{item.author.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value, activeTab)}
                          className={`text-xs px-2 py-1 rounded-full font-semibold border-0 ${statusBadge.class}`}
                        >
                          <option value="draft">Taslak</option>
                          <option value="pending_review">İnceleme Bekliyor</option>
                          <option value="published">Yayınlandı</option>
                          <option value="archived">Arşivlendi</option>
                        </select>
                      </td>
                      {activeTab === 'guides' && 'difficulty' in item && (
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyBadge(item.difficulty).class}`}>
                            {getDifficultyBadge(item.difficulty).label}
                          </span>
                          {item.estimatedTime && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ~{item.estimatedTime} dk
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <Eye className="w-3 h-3" />
                            <span>{item.viewCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-red-500">
                            <Heart className="w-3 h-3" />
                            <span>{item.likeCount}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-blue-500">
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.commentCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          <div>Oluşturuldu: {formatDate(item.createdAt)}</div>
                          <div>Güncellendi: {formatDate(item.updatedAt)}</div>
                          {item.publishedAt && (
                            <div>Yayınlandı: {formatDate(item.publishedAt)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/${activeTab}/${item.slug}`, '_blank')}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => window.open(`/${activeTab}/edit/${item.id}`, '_blank')}
                            className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleTogglePublic(item.id, activeTab)}
                            className={`p-1 ${
                              item.isPublic 
                                ? 'text-orange-600 hover:text-orange-700' 
                                : 'text-purple-600 hover:text-purple-700'
                            }`}
                            title={item.isPublic ? 'Gizli Yap' : 'Herkese Açık Yap'}
                          >
                            {item.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, activeTab)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Sayfa {currentPage} / {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;