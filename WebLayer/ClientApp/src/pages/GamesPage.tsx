import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Users, 
  Gamepad2,
  Grid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { Game, GameFilterDto, Genre } from '../types';
import toast from 'react-hot-toast';

const GamesPage: React.FC = () => {
  const [filters, setFilters] = useState<GameFilterDto>({
    page: 1,
    pageSize: 12,
    searchTerm: '',
    genreIds: [],
    platforms: [],
    sortBy: 'popularity',
    sortOrder: 'desc'
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch games
  const { data: gamesResponse, isLoading, error } = useQuery({
    queryKey: ['games', filters],
    queryFn: async () => {
      console.log('Fetching games with filters:', filters);
      const result = await api.games.getAll(filters);
      console.log('Games API response:', result);
      return result;
    },
    keepPreviousData: true
  });

  // Fetch genres for filter
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      console.log('Fetching genres...');
      const result = await api.genres.getAll();
      console.log('Genres API response:', result);
      return result;
    }
  });

  const games = gamesResponse?.data || [];
  const totalPages = Math.ceil((gamesResponse?.totalCount || 0) / (filters.pageSize || 12));

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof GameFilterDto, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const sortOptions = [
    { value: 'popularity', label: 'Popülerlik' },
    { value: 'rating', label: 'Puan' },
    { value: 'releaseDate', label: 'Çıkış Tarihi' },
    { value: 'name', label: 'İsim' }
  ];

  const platforms = [
    'PC (Microsoft Windows)', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'Mac', 'Linux'
  ];

  useEffect(() => {
    if (error) {
      toast.error('Oyunlar yüklenirken bir hata oluştu');
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-gaming font-bold text-gray-800 dark:text-white">
                Oyun Keşfi
              </h1>
              <p className="text-gray-700 dark:text-gray-400 mt-2">
                {filters.searchTerm ? (
                  <>
                    <span className="font-medium">"{filters.searchTerm}"</span> için {gamesResponse?.totalCount || 0} oyun bulundu
                  </>
                ) : (
                  <>{gamesResponse?.totalCount || 0} oyun bulundu</>
                )}
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Oyun ara..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input pl-10 pr-4 w-full"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtreler
              </button>
              
              <div className="flex rounded-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.searchTerm || (filters.genreIds && filters.genreIds.length > 0) || (filters.platforms && filters.platforms.length > 0)) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif filtreler:</span>
              
              {filters.searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  Arama: "{filters.searchTerm}"
                  <button
                    onClick={() => handleSearch('')}
                    className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.genreIds && filters.genreIds.map(genreId => {
                const genre = genres?.find(g => g.id === genreId);
                return genre ? (
                  <span key={genreId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {genre.name}
                    <button
                      onClick={() => handleFilterChange('genreIds', (filters.genreIds || []).filter(id => id !== genreId))}
                      className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
              
              {filters.platforms && filters.platforms.map(platform => (
                <span key={platform} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {platform === 'PC (Microsoft Windows)' ? 'PC' : platform}
                  <button
                    onClick={() => handleFilterChange('platforms', (filters.platforms as string[] || []).filter((p: string) => p !== platform))}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
              
              <button
                onClick={() => setFilters({
                  page: 1,
                  pageSize: 12,
                  searchTerm: '',
                  genreIds: [],
                  platforms: [],
                  sortBy: 'popularity',
                  sortOrder: 'desc'
                })}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Tümünü temizle
              </button>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-dark-700">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sıralama
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sıra
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="input"
                  >
                    <option value="desc">Azalan</option>
                    <option value="asc">Artan</option>
                  </select>
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Türler
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {genres?.map((genre: any) => (
                      <label key={genre.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(filters.genreIds || []).includes(genre.id)}
                          onChange={(e) => {
                            const currentGenres = filters.genreIds || [];
                            if (e.target.checked) {
                              handleFilterChange('genreIds', [...currentGenres, genre.id]);
                            } else {
                              handleFilterChange('genreIds', currentGenres.filter(id => id !== genre.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{genre.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platformlar
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {platforms.map(platform => (
                      <label key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(filters.platforms as string[] || []).includes(platform)}
                          onChange={(e) => {
                            const currentPlatforms = (filters.platforms as string[]) || [];
                            if (e.target.checked) {
                              handleFilterChange('platforms', [...currentPlatforms, platform]);
                            } else {
                              handleFilterChange('platforms', currentPlatforms.filter(p => p !== platform));
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {platform === 'PC (Microsoft Windows)' ? 'PC' : platform}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    page: 1,
                    pageSize: 12,
                    searchTerm: '',
                    genreIds: [],
                    platforms: [],
                    sortBy: 'popularity',
                    sortOrder: 'desc'
                  })}
                  className="btn-secondary"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Games Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Oyunlar yükleniyor...</p>
            </div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Oyun bulunamadı
            </h3>
            <p className="text-gray-700 dark:text-gray-400">
              Arama kriterlerinizi değiştirmeyi deneyin.
            </p>
          </div>
        ) : (
          <>
            {/* Games Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {games.map((game: Game) => (
                  <Link
                    key={game.id}
                    to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
                    className="card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  >
                    {/* Game Image */}
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden">
                      {game.coverImageUrl ? (
                        <img
                          src={game.coverImageUrl}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Gamepad2 className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                        {game.name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-400 mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{game.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span>{formatDate(game.releaseDate)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-400 line-clamp-2">
                        {game.description}
                      </p>

                      {/* Genres and Themes */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {game.genres?.slice(0, 2).map((genre) => (
                          <span
                            key={genre.id}
                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                          >
                            {genre.name}
                          </span>
                        ))}
                        {game.themes?.slice(0, 2).map((theme) => (
                          <span
                            key={theme.id}
                            className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded"
                          >
                            {theme.name}
                          </span>
                        ))}
                        {((game.genres?.length || 0) + (game.themes?.length || 0)) > 4 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-400 rounded">
                            +{((game.genres?.length || 0) + (game.themes?.length || 0)) - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game: Game) => (
                  <Link
                    key={game.id}
                    to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
                    className="card p-6 hover:shadow-lg transition-all duration-300 group flex items-start space-x-4"
                  >
                    {/* Game Image */}
                    <div className="w-24 h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {game.coverImageUrl ? (
                        <img
                          src={game.coverImageUrl}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Gamepad2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {game.name}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{game.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span>{formatDate(game.releaseDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span>{game.totalReviews || 0} değerlendirme</span>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-400 mb-3 line-clamp-2">
                        {game.description}
                      </p>

                      {/* Genres and Themes */}
                      <div className="flex flex-wrap gap-2">
                        {game.genres?.slice(0, 3).map((genre) => (
                          <span
                            key={genre.id}
                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                          >
                            {genre.name}
                          </span>
                        ))}
                        {game.themes?.slice(0, 3).map((theme) => (
                          <span
                            key={theme.id}
                            className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded"
                          >
                            {theme.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange((filters.page || 1) - 1)}
                    disabled={(filters.page || 1) === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const currentPage = filters.page || 1;
                    const page = i + Math.max(1, currentPage - 2);
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange((filters.page || 1) + 1)}
                    disabled={(filters.page || 1) === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
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

export default GamesPage;