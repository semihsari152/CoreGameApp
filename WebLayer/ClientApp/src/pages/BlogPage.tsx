import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  PenTool, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Eye, 
  MessageSquare,
  Heart,
  Tag,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Star,
  BookOpen,
  Coffee,
  Gamepad2,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Zap,
  Award,
  FileText
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { BlogPost, Game, LikableType, CommentableType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatRelativeTime } from '../utils/dateUtils';
import { getDisplayUsername, getUserProfileLink } from '../utils/helpers';

interface BlogFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  categoryId?: number;
  gameId?: number;
  tags?: string[];
  sortBy: 'latest' | 'popular' | 'trending';
  sortOrder: 'asc' | 'desc';
}

const BlogPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<BlogFilters>({
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 12,
    searchTerm: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
    sortBy: (searchParams.get('sortBy') as 'latest' | 'popular' | 'trending') || 'latest',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);
  const [localCategoryId, setLocalCategoryId] = useState(filters.categoryId);
  const [localGameId, setLocalGameId] = useState(filters.gameId);
  const [localTags, setLocalTags] = useState<string[]>(filters.tags || []);

  // Clean blog content from BBCode tags for preview
  const cleanContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/\[image\].*?\[\/image\]/g, '')
      .replace(/\[video\].*?\[\/video\]/g, '')
      .replace(/\[code(?:=.*?)?\].*?\[\/code\]/g, '')
      .replace(/\[quote\](.*?)\[\/quote\]/g, '$1')
      .replace(/\n\n/g, ' ')
      .trim();
  };

  // Fetch blog posts
  const { data: blogsResponse, isLoading } = useQuery({
    queryKey: ['blogs', filters],
    queryFn: async () => {
      const response = await api.blogs.getAll(filters);
      
      // Fetch statistics for each blog post
      if (response.data && response.data.length > 0) {
        const statsRequests = response.data.map(blog => ({
          likableType: LikableType.BlogPost,
          commentableType: CommentableType.BlogPost,
          entityId: blog.id
        }));
        
        try {
          const batchStats = await api.statistics.getBatchStats(statsRequests);
          
          // Merge statistics with blog data
          response.data = response.data.map(blog => ({
            ...blog,
            likeCount: batchStats[blog.id]?.likeCount || blog.likeCount || 0,
            dislikeCount: batchStats[blog.id]?.dislikeCount || blog.dislikeCount || 0,
            commentCount: batchStats[blog.id]?.commentCount || blog.commentCount || 0
          }));
        } catch (error) {
          console.warn('Failed to fetch blog statistics:', error);
        }
      }
      
      return response;
    },
    keepPreviousData: true
  });

  // Fetch blog categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api.blogs.getCategories(),
    staleTime: 300000 // 5 minutes
  });

  // Fetch games for filter
  const { data: gamesResponse } = useQuery({
    queryKey: ['games-popular'],
    queryFn: () => api.games.getPopular(50),
    staleTime: 300000 // 5 minutes
  });

  const blogs = blogsResponse?.data || [];
  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : ((categoriesResponse as any)?.data || []);
  const games = Array.isArray(gamesResponse) ? gamesResponse : ((gamesResponse as any)?.data || []);
  const totalPages = Math.ceil((blogsResponse?.totalCount || 0) / filters.pageSize);

  // URL parametreleri değiştiğinde filtreleri güncelle
  useEffect(() => {
    const categoryIdFromUrl = searchParams.get('categoryId');
    const searchFromUrl = searchParams.get('search');
    const sortByFromUrl = searchParams.get('sortBy');
    const pageFromUrl = searchParams.get('page');

    const newFilters = {
      ...filters,
      categoryId: categoryIdFromUrl ? parseInt(categoryIdFromUrl) : undefined,
      searchTerm: searchFromUrl || '',
      sortBy: (sortByFromUrl as 'latest' | 'popular' | 'trending') || 'latest',
      page: pageFromUrl ? parseInt(pageFromUrl) : 1
    };

    setFilters(newFilters);
    
    // Local state'leri de güncelle
    setLocalSearchTerm(newFilters.searchTerm);
    setLocalCategoryId(newFilters.categoryId);
    setLocalGameId(newFilters.gameId);
    setLocalTags(newFilters.tags || []);
  }, [searchParams]);

  // Component ilk yüklendiğinde local state'leri senkronize et
  useEffect(() => {
    setLocalSearchTerm(filters.searchTerm);
    setLocalCategoryId(filters.categoryId);
    setLocalGameId(filters.gameId);
    setLocalTags(filters.tags || []);
  }, []);

  const handleSearch = (searchTerm: string) => {
    setLocalSearchTerm(searchTerm);
  };

  const handleFilterChange = (key: keyof BlogFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // URL'yi güncelle
    const params = new URLSearchParams();
    if (newFilters.searchTerm) params.set('search', newFilters.searchTerm);
    if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId.toString());
    if (newFilters.sortBy !== 'latest') params.set('sortBy', newFilters.sortBy);
    if (newFilters.page > 1) params.set('page', newFilters.page.toString());
    
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = () => {
    const newFilters = {
      ...filters,
      searchTerm: localSearchTerm,
      categoryId: localCategoryId,
      gameId: localGameId,
      tags: localTags.length > 0 ? localTags : undefined,
      page: 1
    };
    setFilters(newFilters);
    
    // URL'yi güncelle
    const params = new URLSearchParams();
    if (newFilters.searchTerm) params.set('search', newFilters.searchTerm);
    if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId.toString());
    if (newFilters.sortBy !== 'latest') params.set('sortBy', newFilters.sortBy);
    if (newFilters.page > 1) params.set('page', newFilters.page.toString());
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setLocalSearchTerm('');
    setLocalCategoryId(undefined);
    setLocalGameId(undefined);
    setLocalTags([]);
    const clearedFilters = {
      ...filters,
      searchTerm: '',
      categoryId: undefined,
      gameId: undefined,
      tags: undefined,
      page: 1
    };
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
  };


  const sortOptions = [
    { value: 'latest', label: 'En Yeni' },
    { value: 'popular', label: 'En Popüler' },
    { value: 'trending', label: 'Trend' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-br from-orange-600 to-pink-600 dark:from-orange-800 dark:to-pink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <PenTool className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Gaming Blog
            </h1>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              {filters.searchTerm ? (
                <>
                  <span className="font-medium">"{filters.searchTerm}"</span> için {blogs.length} yazı bulundu
                </>
              ) : (
                "Oyun dünyasındaki en yeni haberler, detaylı incelemeler ve oyuncu deneyimleri burada"
              )}
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {isAuthenticated && (
                <Link
                  to="/blog/create"
                  className="bg-white text-orange-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Yeni Blog Yazısı
                </Link>
              )}
              
              <div className="flex items-center space-x-6 text-orange-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{blogsResponse?.totalCount || 247}</div>
                  <div className="text-sm">Toplam Yazı</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">12.3k</div>
                  <div className="text-sm">Toplam Okuma</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">3.4k</div>
                  <div className="text-sm">Toplam Beğeni</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Blog yazılarında ara..."
                  value={localSearchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-orange-200" />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors ${
                  showFilters || filters.categoryId || filters.gameId || (filters.tags && filters.tags.length > 0)
                    ? 'bg-white/30'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[150px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value} className="text-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex rounded-lg border border-white/30 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white/30 text-white'
                      : 'bg-white/20 text-orange-200 hover:bg-white/30'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white/30 text-white'
                      : 'bg-white/20 text-orange-200 hover:bg-white/30'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-orange-100 mb-2">
                      Kategori
                    </label>
                    <select
                      value={localCategoryId || ''}
                      onChange={(e) => setLocalCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="" className="text-gray-900">Tüm Kategoriler</option>
                      {categories.map((category: any) => (
                        <option key={category.id} value={category.id} className="text-gray-900">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Game Filter */}
                  <div>
                    <label className="block text-sm font-medium text-orange-100 mb-2">
                      Oyun
                    </label>
                    <select
                      value={localGameId || ''}
                      onChange={(e) => setLocalGameId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="" className="text-gray-900">Tüm Oyunlar</option>
                      {games.slice(0, 50).map((game: any) => (
                        <option key={game.id} value={game.id} className="text-gray-900">
                          {game.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm font-medium text-orange-100 mb-2">
                      Etiketler
                    </label>
                    <input
                      type="text"
                      placeholder="Etiket ekle ve Enter'a bas..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newTag = e.currentTarget.value.trim();
                          if (!localTags.includes(newTag) && localTags.length < 5) {
                            setLocalTags([...localTags, newTag]);
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    
                    {localTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {localTags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/20 text-white">
                            #{tag}
                            <button
                              onClick={() => setLocalTags(prev => prev.filter((_, i) => i !== index))}
                              className="ml-1 text-white/70 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-white/30 text-white rounded-lg hover:bg-white/40 transition-colors font-medium"
                  >
                    Filtrele
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isLoading ? (
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="card overflow-hidden">
                    <div className="animate-pulse">
                      <div className="h-48 bg-gray-200 dark:bg-dark-700"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/2 mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded"></div>
                          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="card p-6">
                    <div className="animate-pulse flex space-x-6">
                      <div className="w-32 h-24 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded"></div>
                          <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : blogs.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coffee className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Henüz blog yazısı yok
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
              {filters.searchTerm 
                ? `"${filters.searchTerm}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.`
                : 'İlk blog yazısını siz yazın ve deneyimlerinizi toplulukla paylaşın!'
              }
            </p>
            {isAuthenticated && !filters.searchTerm && (
              <Link to="/blog/create" className="btn-primary inline-flex items-center text-lg px-8 py-4">
                <PenTool className="w-6 h-6 mr-3" />
                İlk Blog Yazımı Yaz
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Blog Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog: BlogPost) => (
                  <Link
                    key={blog.id}
                    to={blog.slug ? `/blog/${blog.slug}` : `/blogs/${blog.id}`}
                    className="card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 flex flex-col h-full"
                  >
                    {/* Blog Image */}
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-800/20 flex items-center justify-center overflow-hidden relative">
                      {blog.thumbnailUrl ? (
                        <img
                          src={blog.thumbnailUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-800/30 dark:to-pink-800/30">
                          <BookOpen className="w-16 h-16 text-orange-500 dark:text-orange-400" />
                        </div>
                      )}
                      
                      {/* Game badge - top right corner */}
                      {blog.game && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100/95 text-green-800 dark:bg-green-900/95 dark:text-green-200 backdrop-blur-sm shadow-sm border border-green-200/50 dark:border-green-800/50">
                            <Gamepad2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{blog.game.name}</span>
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Blog Info */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-clamp-2 text-break leading-tight">
                        {blog.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-clamp-3 text-break leading-relaxed">
                        {blog.summary || cleanContent(blog.content)?.substring(0, 200) + '...'}
                      </p>

                      {/* Fixed bottom section: Tags -> Stats -> Author */}
                      <div className="mt-auto space-y-3">
                        {/* Tags */}
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {blog.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                #{tag}
                              </span>
                            ))}
                            {blog.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                +{blog.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats with Date */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="w-4 h-4 text-green-500" />
                              <span>{blog.likeCount || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ThumbsDown className="w-4 h-4 text-red-600" />
                              <span>{blog.dislikeCount || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              <span>{blog.commentCount || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4 text-purple-500" />
                              <span>{blog.viewCount || 0}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(blog.createdAt)}
                          </div>
                        </div>

                        {/* Author with Game and Category */}
                        <div className="border-t border-gray-100 dark:border-dark-700 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              {(() => {
                                const username = blog.author?.username || '';
                                const isActive = blog.author?.isActive ?? true;
                                const displayUsername = getDisplayUsername(username, isActive);
                                const profileLink = getUserProfileLink(username, isActive);
                                
                                return (
                                  <>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0 ${isActive ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-gray-500'}`}>
                                      {blog.author?.avatarUrl ? (
                                        <img 
                                          src={blog.author.avatarUrl} 
                                          alt={displayUsername}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-bold">${displayUsername.charAt(0).toUpperCase()}</span>`;
                                          }}
                                        />
                                      ) : (
                                        <span>{displayUsername.charAt(0).toUpperCase()}</span>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      {isActive ? (
                                        <button 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(profileLink);
                                          }}
                                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block truncate text-left w-full"
                                        >
                                          {displayUsername}
                                        </button>
                                      ) : (
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic truncate">
                                          {displayUsername}
                                        </p>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* Game and Category badges */}
                            {(blog.game || blog.category) && (
                              <div className="flex flex-wrap gap-1 ml-2">
                    
                                {blog.category && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    {blog.category.name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {blogs.map((blog: BlogPost) => (
                  <Link
                    key={blog.id}
                    to={blog.slug ? `/blog/${blog.slug}` : `/blogs/${blog.id}`}
                    className="card p-4 hover:shadow-xl transition-all duration-300 group flex items-start space-x-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700"
                  >
                    {/* Blog Thumbnail */}
                    <div className="w-24 h-16 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-800/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {blog.thumbnailUrl ? (
                        <img
                          src={blog.thumbnailUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-800/30 dark:to-pink-800/30">
                          <BookOpen className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Blog Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-clamp-2 text-break leading-tight">
                            {blog.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-3 text-clamp-2 text-break text-sm leading-relaxed">
                            {blog.summary || cleanContent(blog.content)?.substring(0, 200) + '...'}
                          </p>

                          {/* Tags */}
                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4 relative">
                              {blog.tags.slice(0, 4).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {blog.tags.length > 4 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                  +{blog.tags.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                {blog.author?.avatarUrl ? (
                                  <img 
                                    src={blog.author.avatarUrl} 
                                    alt={blog.author.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = `<span class="text-white font-bold text-sm">${blog.author?.username?.charAt(0).toUpperCase()}</span>`;
                                    }}
                                  />
                                ) : (
                                  <span>{blog.author?.username?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{blog.author?.username}</p>
                                <p className="text-xs text-gray-500">{formatDate(blog.createdAt)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                              <div className="flex items-center space-x-1">
                                <ThumbsUp className="w-4 h-4 text-green-500" />
                                <span>{blog.likeCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                                <span>{blog.dislikeCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <span>{blog.commentCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4 text-purple-500" />
                                <span>{blog.viewCount || 0}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {blog.game && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Gamepad2 className="w-3 h-3 mr-0.5" />
                                  {blog.game.name}
                                </span>
                              )}
                              {blog.category && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  {blog.category.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2 bg-white dark:bg-dark-800 rounded-xl p-2 shadow-lg border border-gray-200 dark:border-dark-700">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-3 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, filters.page - 2);
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[44px] px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          page === filters.page
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="p-3 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default BlogPage;