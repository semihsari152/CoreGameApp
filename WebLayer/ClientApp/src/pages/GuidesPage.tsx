import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
 
  Eye, 
  Clock, 
  User, 
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  Grid,
  List as ListIcon,
  ChevronDown,
  Target,
  Heart,
  Share2,
  ArrowRight,
  Users,
  Play,
  FolderOpen,
  Circle,
  MessageSquare,
  ThumbsDown,
  ThumbsUp
} from 'lucide-react';
import { Guide, GuideCategory } from '../types/guide';
import { LikableType, CommentableType } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface Game {
  id: number;
  name: string;
}

interface GuideFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  gameId?: number;
  categoryId?: number;
  difficulty?: string;
  sortBy: 'latest' | 'popular';
}

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Tümü', icon: Target, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { value: 'Çok Kolay', label: 'Çok Kolay', icon: Circle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'Kolay', label: 'Kolay', icon: Circle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'Orta', label: 'Orta', icon: Circle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'Zor', label: 'Zor', icon: Circle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'Çok Zor', label: 'Çok Zor', icon: Circle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'En Yeniler', icon: Clock },
  { value: 'popular', label: 'En Popüler', icon: Eye },
];

const GuidesPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalGuides, setTotalGuides] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [filters, setFilters] = useState<GuideFilters>({
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 12,
    searchTerm: searchParams.get('search') || '',
    gameId: searchParams.get('gameId') ? parseInt(searchParams.get('gameId')!) : undefined,
    categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
    difficulty: searchParams.get('difficulty') || '',
    sortBy: (searchParams.get('sortBy') as 'latest' | 'popular') || 'latest',
  });

  const loadGuides = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('pageSize', filters.pageSize.toString());
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.gameId) params.append('gameId', filters.gameId.toString());
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      params.append('sortBy', filters.sortBy);

      const response = await fetch(`/api/guides?${params.toString()}`);
      const result = await response.json();
      
      if (result.data && result.data.length > 0) {
        // Fetch statistics for each guide
        try {
          const statsRequests = result.data.map((guide: Guide) => ({
            likableType: LikableType.Guide,
            commentableType: CommentableType.Guide,
            entityId: guide.id
          }));
          
          const statsResponse = await fetch('/api/statistics/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests: statsRequests })
          });
          
          if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            const batchStats = statsResult.data || {};
            
            // Merge statistics with guide data
            result.data = result.data.map((guide: Guide) => ({
              ...guide,
              likeCount: batchStats[guide.id]?.likeCount || guide.likeCount || 0,
              dislikeCount: batchStats[guide.id]?.dislikeCount || guide.dislikeCount || 0,
              commentCount: batchStats[guide.id]?.commentCount || guide.commentCount || 0
            }));
          }
        } catch (statsError) {
          console.warn('Failed to fetch guide statistics:', statsError);
        }
        
        setGuides(result.data);
        setTotalGuides(result.totalCount || result.data.length || 0);
      }
    } catch (error) {
      console.error('Failed to load guides:', error);
      toast.error('Rehberler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/guides/categories');
      const result = await response.json();
      if (result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadGames = useCallback(async () => {
    try {
      const response = await fetch('/api/games?pageSize=100');
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setGames(result.data);
      } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
        setGames(result.data.data);
      } else {
        setGames([]); // Fallback to empty array
      }
    } catch (error) {
      console.error('Failed to load games:', error);
      setGames([]); // Fallback to empty array on error
    }
  }, []);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  useEffect(() => {
    loadCategories();
    loadGames();
  }, [loadCategories, loadGames]);

  const updateFilters = (newFilters: Partial<GuideFilters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    
    const params = new URLSearchParams();
    if (updated.searchTerm) params.set('search', updated.searchTerm);
    if (updated.gameId) params.set('gameId', updated.gameId.toString());
    if (updated.categoryId) params.set('categoryId', updated.categoryId.toString());
    if (updated.difficulty) params.set('difficulty', updated.difficulty);
    params.set('sortBy', updated.sortBy);
    params.set('page', updated.page.toString());
    
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchTerm = formData.get('search') as string;
    updateFilters({ searchTerm });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const getDifficultyDisplay = (difficulty: string) => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option || { value: difficulty, label: difficulty, icon: Target, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)} gün önce`;
    if (diffInHours < 24 * 30) return `${Math.floor(diffInHours / (24 * 7))} hafta önce`;
    return `${Math.floor(diffInHours / (24 * 30))} ay önce`;
  };

  const totalPages = Math.ceil((totalGuides || 0) / filters.pageSize);

  const renderGuideCard = (guide: Guide) => {
    const difficultyInfo = getDifficultyDisplay(guide.difficulty);
    
    return (
      <Link 
        key={guide.id} 
        to={guide.slug ? `/guide/${guide.slug}` : `/guides/${guide.id}`}
        className="group relative bg-white dark:bg-dark-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-gray-100 dark:border-dark-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:-translate-y-2 block flex flex-col h-full"
      >
        {/* Header with gradient overlay */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-100 via-blue-50 to-cyan-100 dark:from-indigo-900/30 dark:via-blue-900/20 dark:to-cyan-900/30 overflow-hidden">
          {guide.thumbnailUrl ? (
            <img 
              src={guide.thumbnailUrl} 
              alt={guide.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-200 to-cyan-200 dark:from-indigo-800/50 dark:to-cyan-800/50">
              <BookOpen className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          

          {/* Game badge - if exists */}
          {guide.game && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 dark:bg-dark-800/95 text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-lg border border-white/50">
              🎮 {guide.game.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 relative flex flex-col flex-1">
          {/* Title section */}
          <div className="mb-4">
            <div className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-clamp-2 text-break mb-2 leading-tight">
                {guide.title}
              </h3>
            </div>
            
            {guide.summary && (
              <p className="text-gray-600 dark:text-gray-400 text-sm text-clamp-2 text-break leading-relaxed">
                {guide.summary}
              </p>
            )}
          </div>

          {/* Tags row */}
          {guide.tags && guide.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {guide.tags.slice(0, 2).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800"
                >
                  #{tag}
                </span>
              ))}
              {guide.tags.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  +{guide.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Fixed bottom section: Stats -> Category -> Author */}
          <div className="space-y-3 mt-auto">
            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span className="font-medium">{guide.likeCount || 0}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span className="font-medium">{guide.dislikeCount || 0}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{guide.commentCount || 0}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="font-medium">{guide.viewCount || 0}</span>
              </span>
            </div>

            {/* Category */}
            {guide.guideCategory && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full border border-indigo-200 dark:border-indigo-800">
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {guide.guideCategory.name}
                </span>
              </div>
            )}

            {/* Author and Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg overflow-hidden">
                  {guide.user?.avatarUrl ? (
                    <img 
                      src={guide.user.avatarUrl} 
                      alt={guide.user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-bold">${(guide.user?.username?.charAt(0)?.toUpperCase() || 'U')}</span>`;
                      }}
                    />
                  ) : (
                    <span>{guide.user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {guide.user?.username || 'Anonim'}
                  </p>
                </div>
              </div>
              
              <span className="text-xs text-gray-400 bg-gray-50 dark:bg-dark-700 px-2 py-1 rounded-md">
                {formatTimeAgo(guide.createdDate)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Oyun Rehberleri
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Topluluk tarafından hazırlanmış kapsamlı oyun rehberleri ile seviyenizi geliştirin
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {isAuthenticated && (
                <Link
                  to="/guides/create"
                  className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Yeni Rehber Oluştur
                </Link>
              )}
              
              <div className="flex items-center space-x-6 text-indigo-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{(totalGuides || 0).toLocaleString()}</div>
                  <div className="text-sm">Toplam Rehber</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">8.7k</div>
                  <div className="text-sm">Toplam Görüntülenme</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">2.1k</div>
                  <div className="text-sm">Aktif Kullanıcı</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.searchTerm}
                  placeholder="Rehber ara..."
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-indigo-200" />
              </div>

              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value as 'latest' | 'popular' })}
                className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[150px]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="text-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                type="button"
                className={`px-4 py-3 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors ${
                  showMobileFilters || filters.difficulty || filters.gameId || filters.categoryId
                    ? 'bg-white/30'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Ara
              </button>
            </form>

            {/* Filters Panel */}
            {showMobileFilters && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">
                  Zorluk Seviyesi
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => updateFilters({ difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">
                  Kategori
                </label>
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => updateFilters({ categoryId: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="" className="text-gray-900">Tüm Kategoriler</option>
                  {Array.isArray(categories) && categories.map((category) => (
                    <option key={category.id} value={category.id} className="text-gray-900">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Filter */}
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">
                  Oyun
                </label>
                <select
                  value={filters.gameId || ''}
                  onChange={(e) => updateFilters({ gameId: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="" className="text-gray-900">Tüm Oyunlar</option>
                  {Array.isArray(games) && games.map((game) => (
                    <option key={game.id} value={game.id} className="text-gray-900">
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-3xl shadow-lg p-6 animate-pulse border-2 border-gray-100 dark:border-dark-700">
                <div className="h-48 bg-gray-200 dark:bg-dark-700 rounded-2xl mb-6"></div>
                <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3 mb-4"></div>
                <div className="flex gap-2 mb-5">
                  <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded-lg w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded-lg w-24"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded-xl w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Henüz rehber bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Filtrelerinizi değiştirmeyi deneyin veya ilk rehberi siz oluşturun!
            </p>
            {isAuthenticated && (
              <Link
                to="/guides/create"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                İlk Rehberi Oluştur
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {guides.map(renderGuideCard)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, filters.page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        pageNum === filters.page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page === totalPages}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GuidesPage;