import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Plus, 
  Pin, 
  Lock, 
  Eye, 
  Clock,
  Search,
  Filter,
  TrendingUp,
  MessageCircle,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Heart
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { ForumCategory, ForumTopic, LikableType, CommentableType } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ForumPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : null
  );
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => api.forum.getCategories()
  });

  // Fetch games for filter
  const { data: games } = useQuery({
    queryKey: ['games-popular'],
    queryFn: () => api.games.getPopular(50),
    staleTime: 300000 // 5 minutes
  });

  // Fetch topics - manual trigger for filtering
  const [shouldFetch, setShouldFetch] = useState(true);
  const [lastAppliedFilters, setLastAppliedFilters] = useState<{
    categoryId: number | null;
    gameId: number | null;
    tags: string[];
    searchTerm: string;
    sortBy: string;
  }>({
    categoryId: null,
    gameId: null,
    tags: [],
    searchTerm: '',
    sortBy: 'latest'
  });

  // URL'den kategori alındığında filtreleri uygula
  useEffect(() => {
    const categoryIdFromUrl = searchParams.get('categoryId');
    if (categoryIdFromUrl) {
      const categoryId = parseInt(categoryIdFromUrl);
      setSelectedCategory(categoryId);
      setLastAppliedFilters({
        categoryId: categoryId,
        gameId: null,
        tags: [],
        searchTerm: '',
        sortBy: 'latest'
      });
      setShouldFetch(prev => !prev);
    }
  }, [searchParams]);
  
  const { data: topicsResponse, isLoading: topicsLoading } = useQuery({
    queryKey: ['forum-topics', lastAppliedFilters, shouldFetch],
    queryFn: async () => {
      const response = await api.forum.getTopics({
        categoryId: lastAppliedFilters.categoryId,
        gameId: lastAppliedFilters.gameId,
        tags: lastAppliedFilters.tags,
        searchTerm: lastAppliedFilters.searchTerm,
        sortBy: lastAppliedFilters.sortBy,
        page: 1,
        pageSize: 20
      });
      
      // Fetch statistics for each forum topic
      if (response.data && response.data.length > 0) {
        const statsRequests = response.data.map(topic => ({
          likableType: LikableType.ForumTopic,
          commentableType: CommentableType.ForumTopic,
          entityId: topic.id
        }));
        
        try {
          const batchStats = await api.statistics.getBatchStats(statsRequests);
          
          // Merge statistics with topic data
          response.data = response.data.map(topic => ({
            ...topic,
            likeCount: batchStats[topic.id]?.likeCount || topic.likeCount || 0,
            dislikeCount: batchStats[topic.id]?.dislikeCount || topic.dislikeCount || 0,
            commentCount: batchStats[topic.id]?.commentCount || topic.commentCount || 0
          }));
        } catch (error) {
          console.warn('Failed to fetch forum statistics:', error);
        }
      }
      
      return response;
    }
  });

  const topics = topicsResponse?.data || [];

  // Calculate topic counts for each category from actual topics
  const categoryTopicCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    topics.forEach(topic => {
      const categoryId = topic.category?.id || topic.forumCategory?.id;
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [topics]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cleanContentForPreview = (content: string) => {
    if (!content) return '';
    
    // Remove image tags and their content
    const withoutImages = content.replace(/\[image\].*?\[\/image\]/g, '');
    
    // Remove excessive whitespace and newlines
    const cleaned = withoutImages.replace(/\s+/g, ' ').trim();
    
    // Limit length for preview
    return cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
  };

  const getTopicIcon = (topic: ForumTopic) => {
    if (topic.isPinned) return <Pin className="w-4 h-4 text-green-600" />;
    if (topic.isLocked) return <Lock className="w-4 h-4 text-red-600" />;
    return <MessageSquare className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-800 dark:to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Community Forum
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              {searchTerm ? (
                <>
                  <span className="font-medium">"{searchTerm}"</span> için {topics.length} sonuç bulundu
                </>
              ) : (
                "Oyun tutkularıyla tartışın, deneyimlerinizi paylaşın ve sorularınızın cevabını bulun"
              )}
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {isAuthenticated && (
                <Link
                  to="/forum/create"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Yeni Konu Oluştur
                </Link>
              )}
              
              <div className="flex items-center space-x-6 text-purple-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{topics.length || 1234}</div>
                  <div className="text-sm">Toplam Konu</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">5.6k</div>
                  <div className="text-sm">Toplam Mesaj</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">890</div>
                  <div className="text-sm">Aktif Üye</div>
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
                  placeholder="Konularda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-purple-200" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors ${
                  showFilters || selectedCategory || selectedGame || selectedTags.length > 0
                    ? 'bg-white/30'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[150px]"
              >
                <option value="latest" className="text-gray-900">En Yeni</option>
                <option value="popular" className="text-gray-900">En Popüler</option>
                <option value="oldest" className="text-gray-900">En Eski</option>
              </select>
            </div>
            
            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Kategori
                    </label>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="" className="text-gray-900">Tüm Kategoriler</option>
                      {((categories?.data || categories) as ForumCategory[])?.map((category: ForumCategory) => (
                        <option key={category.id} value={category.id} className="text-gray-900">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Game Filter */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Oyun
                    </label>
                    <select
                      value={selectedGame || ''}
                      onChange={(e) => setSelectedGame(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="" className="text-gray-900">Tüm Oyunlar</option>
                      {games?.slice(0, 30).map((game) => (
                        <option key={game.id} value={game.id} className="text-gray-900">
                          {game.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Etiketler
                    </label>
                    <input
                      type="text"
                      placeholder="Etiket ekle (max 3 adet)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newTag = e.currentTarget.value.trim();
                          if (newTag && selectedTags.length < 3) {
                            if (!selectedTags.includes(newTag)) {
                              console.log('Adding tag:', newTag, 'Current tags:', selectedTags);
                              const newTags = [...selectedTags, newTag];
                              console.log('New tags array will be:', newTags);
                              setSelectedTags(newTags);
                            } else {
                              console.log('Tag already exists:', newTag);
                            }
                          } else if (selectedTags.length >= 3) {
                            toast.error('Maksimum 3 etiket ekleyebilirsiniz');
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/20 text-white">
                            {tag}
                            <button
                              onClick={() => setSelectedTags(prev => prev.filter((_, i) => i !== index))}
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
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedGame(null);
                      setSelectedTags([]);
                      setSearchTerm('');
                      // Filtreleri temizle ve uygula
                      setLastAppliedFilters({
                        categoryId: null,
                        gameId: null,
                        tags: [],
                        searchTerm: '',
                        sortBy: 'latest'
                      });
                      setShouldFetch(prev => !prev);
                    }}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                  <button
                    onClick={() => {
                      console.log('Current state before applying:', { selectedCategory, selectedGame, selectedTags, searchTerm, sortBy });
                      console.log('selectedTags array:', selectedTags, 'Length:', selectedTags.length);
                      // Mevcut filtreleri uygula
                      const filtersToApply = {
                        categoryId: selectedCategory,
                        gameId: selectedGame,
                        tags: selectedTags,
                        searchTerm: searchTerm,
                        sortBy: sortBy
                      };
                      console.log('Applying filters:', filtersToApply);
                      setLastAppliedFilters(filtersToApply);
                      setShouldFetch(prev => !prev);
                    }}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Popüler Kategoriler:</span>
            
            {categoriesLoading ? (
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-dark-700 rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    // Tüm kategoriler seçildiğinde filtreleri otomatik uygula
                    const filtersToApply = {
                      categoryId: null,
                      gameId: selectedGame,
                      tags: selectedTags,
                      searchTerm: searchTerm,
                      sortBy: sortBy
                    };
                    setLastAppliedFilters(filtersToApply);
                    setShouldFetch(prev => !prev);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  Tüm Kategoriler
                </button>
                
                {((categories?.data || categories) as ForumCategory[])?.sort((a, b) => (categoryTopicCounts[b.id] || 0) - (categoryTopicCounts[a.id] || 0)).slice(0, 8).map((category: ForumCategory) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      // Kategori seçildiğinde filtreleri otomatik uygula
                      const filtersToApply = {
                        categoryId: category.id,
                        gameId: selectedGame,
                        tags: selectedTags,
                        searchTerm: searchTerm,
                        sortBy: sortBy
                      };
                      setLastAppliedFilters(filtersToApply);
                      setShouldFetch(prev => !prev);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {category.name} ({categoryTopicCounts[category.id] || 0})
                  </button>
                ))}
                
              </>
            )}
          </div>
        </div>
        
        {/* Topics List - Full Width */}
        <div>

            {topicsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="card p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topics.length === 0 ? (
              <div className="card p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Henüz konu bulunmuyor
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  İlk konuyu siz oluşturun ve tartışmayı başlatın!
                </p>
                {isAuthenticated && (
                  <Link to="/forum/create-topic" className="btn-primary inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Konu Oluştur
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map((topic: ForumTopic) => (
                  <Link
                    key={topic.id}
                    to={topic.slug ? `/forum/${topic.slug}` : `/forum/topic/${topic.id}`}
                    className="card p-6 hover:shadow-md transition-shadow group block"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 pt-1">
                        {getTopicIcon(topic)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-break text-clamp-2">
                              {topic.title}
                            </h3>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-clamp-2 text-break">
                              {cleanContentForPreview(topic.content)}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-gray-500 dark:text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {topic.user?.username || topic.author?.username || ''}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>{formatDate(topic.createdDate || topic.createdAt || new Date().toISOString())}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ThumbsUp className="w-3 h-3 flex-shrink-0 text-green-500" />
                                <span>{topic.likeCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ThumbsDown className="w-3 h-3 flex-shrink-0 text-red-500" />
                                <span>{topic.dislikeCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3 flex-shrink-0 text-blue-500" />
                                <span>{topic.commentCount || topic.replyCount || 0} yanıt</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3 flex-shrink-0 text-purple-500" />
                                <span>{topic.viewCount || 0} görüntüleme</span>
                              </div>
                            </div>

                            {/* Tags */}
                            {topic.tags && topic.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {topic.tags.slice(0, 5).map((tag: string, index: number) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    #{tag}
                                  </span>
                                ))}
                                {topic.tags.length > 5 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                    +{topic.tags.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex flex-col items-end justify-between h-full">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 whitespace-nowrap">
                              {topic.category?.name}
                            </span>
                            {/* Oyun bilgisi - sağ alt köşede */}
                            {topic.game && (
                              <div className="mt-auto">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                                  🎮 {topic.game.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination could go here */}
        </div>
      </div>
    </div>
  );
};

export default ForumPage;