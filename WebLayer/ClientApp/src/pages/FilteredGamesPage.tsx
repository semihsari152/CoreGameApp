import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, 
  Calendar, 
  Users, 
  Gamepad2,
  ArrowLeft,
  Grid,
  List,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { Game } from '../types';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

interface FilteredGamesPageProps {
  filterType: 'genres' | 'themes' | 'game-modes' | 'player-perspectives' | 'keywords' | 'platforms';
}

const FilteredGamesPage: React.FC<FilteredGamesPageProps> = ({ filterType }) => {
  const { id } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'releaseDate' | 'name'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Fetch filtered games based on filter type
  const { data: gamesData, isLoading, error } = useQuery({
    queryKey: ['filteredGames', filterType, id, searchTerm, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      if (!id) throw new Error('No filter ID provided');
      
      let games: Game[] = [];
      let filterName = '';

      try {
        switch (filterType) {
          case 'genres':
            try {
              const basicGames = await api.genres.getGames(parseInt(id));
              const genre = await api.genres.getById(parseInt(id));
              filterName = genre.name;
              
              // Get full game details for each game
              games = await Promise.all(
                basicGames.map(async (basicGame: any) => {
                  try {
                    return await api.games.getById(basicGame.id);
                  } catch {
                    return basicGame; // Fallback to basic data
                  }
                })
              );
            } catch {
              games = [];
              filterName = 'Genre';
            }
            break;
          case 'themes':
            try {
              const basicGames = await api.games.getByTheme(parseInt(id));
              
              // Get full game details for each game
              games = await Promise.all(
                basicGames.map(async (basicGame: any) => {
                  try {
                    return await api.games.getById(basicGame.id);
                  } catch {
                    return basicGame;
                  }
                })
              );
              
              // Get theme name from full game data
              if (games.length > 0 && games[0].themes) {
                const foundTheme = games[0].themes.find((t: any) => t.id.toString() === id);
                filterName = foundTheme ? foundTheme.name : 'Theme';
              } else {
                filterName = 'Theme';
              }
            } catch {
              games = [];
              filterName = 'Theme';
            }
            break;
          case 'game-modes':
            try {
              const basicGames = await api.games.getByGameMode(parseInt(id));
              
              // Get full game details for each game
              games = await Promise.all(
                basicGames.map(async (basicGame: any) => {
                  try {
                    return await api.games.getById(basicGame.id);
                  } catch {
                    return basicGame;
                  }
                })
              );
              
              // Get game mode name from full game data
              if (games.length > 0 && games[0].gameModes) {
                const foundMode = games[0].gameModes.find((m: any) => m.id.toString() === id);
                filterName = foundMode ? foundMode.name : 'Game Mode';
              } else {
                filterName = 'Game Mode';
              }
            } catch {
              games = [];
              filterName = 'Game Mode';
            }
            break;
          case 'player-perspectives':
            try {
              const basicGames = await api.games.getByPlayerPerspective(parseInt(id));
              
              // Get full game details for each game
              games = await Promise.all(
                basicGames.map(async (basicGame: any) => {
                  try {
                    return await api.games.getById(basicGame.id);
                  } catch {
                    return basicGame;
                  }
                })
              );
              
              // Get perspective name from full game data
              if (games.length > 0 && games[0].playerPerspectives) {
                const foundPerspective = games[0].playerPerspectives.find((p: any) => p.id.toString() === id);
                filterName = foundPerspective ? foundPerspective.name : 'Player Perspective';
              } else {
                filterName = 'Player Perspective';
              }
            } catch {
              games = [];
              filterName = 'Player Perspective';
            }
            break;
          case 'keywords':
            try {
              const basicGames = await api.games.getByKeyword(parseInt(id));
              
              // Get full game details for each game
              games = await Promise.all(
                basicGames.map(async (basicGame: any) => {
                  try {
                    return await api.games.getById(basicGame.id);
                  } catch {
                    return basicGame;
                  }
                })
              );
              
              // Get keyword name from full game data
              if (games.length > 0 && games[0].keywords) {
                const foundKeyword = games[0].keywords.find((k: any) => k.id.toString() === id);
                filterName = foundKeyword ? foundKeyword.name : 'Keyword';
              } else {
                filterName = 'Keyword';
              }
            } catch {
              games = [];
              filterName = 'Keywords';
            }
            break;
          case 'platforms':
            try {
              const basicGames = await api.games.getByPlatform(parseInt(id));
              
              // Get full game details for each game
              games = await Promise.all(
                basicGames.map(async (basicGame: any) => {
                  try {
                    return await api.games.getById(basicGame.id);
                  } catch {
                    return basicGame;
                  }
                })
              );
              
              // Get platform name from full game data
              if (games.length > 0 && games[0].platforms) {
                const foundPlatform = games[0].platforms.find((p: any) => p.id.toString() === id);
                filterName = foundPlatform ? foundPlatform.name : 'Platform';
              } else {
                filterName = 'Platform';
              }
            } catch {
              games = [];
              filterName = 'Platform';
            }
            break;
          default:
            throw new Error('Invalid filter type');
        }
      } catch (error) {
        console.log('API not implemented yet for', filterType);
        games = [];
        filterName = filterType;
      }

      // Convert API data to Game format with comprehensive field mapping
      const convertedGames = games.map((game: any) => ({
        id: game.id || game.Id,
        name: game.name || game.Name,
        description: game.description || game.Description || game.summary || game.Summary,
        summary: game.summary || game.Summary,
        storyline: game.storyline || game.Storyline,
        releaseDate: game.releaseDate || game.ReleaseDate,
        publisher: game.publisher || game.Publisher,
        developer: game.developer || game.Developer,
        isEarlyAccess: game.isEarlyAccess || game.IsEarlyAccess || false,
        metacriticScore: game.metacriticScore || game.MetacriticScore,
        igdbId: game.igdbId || game.IgdbId,
        igdbSlug: game.igdbSlug || game.IgdbSlug,
        igdbUrl: game.igdbUrl || game.IgdbUrl,
        coverImageId: game.coverImageId || game.CoverImageId,
        coverImageUrl: game.coverImageUrl || game.CoverImageUrl,
        bannerImageUrl: game.bannerImageUrl || game.BannerImageUrl,
        officialWebsite: game.officialWebsite || game.OfficialWebsite,
        rating: game.rating || game.Rating || game.averageRating || game.AverageRating || 0,
        averageRating: game.averageRating || game.AverageRating || game.rating || game.Rating || 0,
        totalReviews: game.totalReviews || game.TotalReviews || game.ratingsCount || game.RatingsCount || 0,
        ratingsCount: game.ratingsCount || game.RatingsCount || game.totalReviews || game.TotalReviews || 0,
        favoriteCount: game.favoriteCount || game.FavoriteCount || 0,
        viewCount: game.viewCount || game.ViewCount || 0,
        guideCount: game.guideCount || game.GuideCount || 0,
        genres: game.genres || game.Genres || [],
        themes: game.themes || game.Themes || [],
        platforms: game.platforms || game.Platforms || [],
        gameModes: game.gameModes || game.GameModes || [],
        playerPerspectives: game.playerPerspectives || game.PlayerPerspectives || [],
        keywords: game.keywords || game.Keywords || [],
        companies: game.companies || game.Companies || [],
        websites: game.websites || game.Websites || [],
        screenshots: game.screenshots || game.Screenshots || [],
        videos: game.videos || game.Videos || [],
        gameMedia: game.gameMedia || game.GameMedia || [],
        gameSeries: game.gameSeries || game.GameSeries,
        guides: game.guides || game.Guides || [],
        blogPosts: game.blogPosts || game.BlogPosts || [],
        beatTimes: game.beatTimes || game.BeatTimes,
        igdbRating: game.igdbRating || game.IgdbRating,
        reviews: game.reviews || game.Reviews || [],
        tags: game.tags || game.Tags || []
      }));

      // Apply client-side filtering and sorting
      let filteredGames = convertedGames;
      
      if (searchTerm) {
        filteredGames = convertedGames.filter(game => 
          game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort games
      filteredGames.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'rating':
            comparison = (a.rating || 0) - (b.rating || 0);
            break;
          case 'releaseDate':
            const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
            const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
            comparison = dateA - dateB;
            break;
          case 'popularity':
          default:
            comparison = (a.totalReviews || 0) - (b.totalReviews || 0);
            break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Pagination
      const totalCount = filteredGames.length;
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedGames = filteredGames.slice(startIndex, startIndex + pageSize);

      return {
        games: paginatedGames,
        totalCount,
        filterName
      };
    },
    keepPreviousData: true
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Bilinmiyor';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR');
    } catch {
      return 'Bilinmiyor';
    }
  };

  const getFilterDisplayName = () => {
    switch (filterType) {
      case 'genres': return 'Genre';
      case 'themes': return 'Theme';
      case 'game-modes': return 'Game Mode';
      case 'player-perspectives': return 'Player Perspective';
      case 'keywords': return 'Keyword';
      case 'platforms': return 'Platform';
      default: return 'Filter';
    }
  };

  const totalPages = Math.ceil((gamesData?.totalCount || 0) / pageSize);

  useEffect(() => {
    if (error) {
      toast.error('Oyunlar yüklenirken bir hata oluştu');
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Oyunlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !gamesData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Hata</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Oyunlar yüklenirken bir hata oluştu</p>
          <Link to="/games" className="btn-primary inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Oyunlara Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/games" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Oyunlara Dön
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-gaming font-bold text-gray-900 dark:text-white">
                {getFilterDisplayName()}: {gamesData.filterName || 'Bilinmiyor'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {gamesData.totalCount} oyun bulundu
              </p>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Oyunlarda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 pr-4 w-full sm:w-64"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>

              {/* Sort Controls */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input"
                >
                  <option value="popularity">Popülerlik</option>
                  <option value="rating">Puan</option>
                  <option value="releaseDate">Çıkış Tarihi</option>
                  <option value="name">İsim</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="input"
                >
                  <option value="desc">Azalan</option>
                  <option value="asc">Artan</option>
                </select>
              </div>

              {/* View Mode Toggle */}
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
        </div>
      </div>

      {/* Games Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gamesData.games.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Oyun bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Bu kategoride oyun bulunmuyor veya arama kriterlerinizi değiştirmeyi deneyin.
            </p>
          </div>
        ) : (
          <>
            {/* Games Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gamesData.games.map((game) => (
                  <Link
                    key={game.id}
                    to={(game as any).slug ? `/games/${(game as any).slug}` : `/games/${game.id}`}
                    className="card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  >
                    {/* Game Image */}
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden relative">
                      {game.coverImageUrl ? (
                        <>
                          <img
                            src={game.coverImageUrl}
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="hidden absolute inset-0 items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600">
                            <Gamepad2 className="w-12 h-12 text-gray-400" />
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Gamepad2 className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                        {game.name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{game.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{game.releaseDate ? formatDate(game.releaseDate) : 'Bilinmiyor'}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {game.description || 'Açıklama mevcut değil'}
                      </p>

                      {/* Genres and Themes */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {game.genres?.slice(0, 2).map((genre: any) => (
                          <span
                            key={genre.id}
                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                          >
                            {genre.name}
                          </span>
                        ))}
                        {game.themes?.slice(0, 2).map((theme: any) => (
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
            ) : (
              <div className="space-y-4">
                {gamesData.games.map((game) => (
                  <Link
                    key={game.id}
                    to={(game as any).slug ? `/games/${(game as any).slug}` : `/games/${game.id}`}
                    className="card p-6 hover:shadow-lg transition-all duration-300 group flex items-start space-x-4"
                  >
                    {/* Game Image */}
                    <div className="w-24 h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {game.coverImageUrl ? (
                        <>
                          <img
                            src={game.coverImageUrl}
                            alt={game.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="hidden absolute inset-0 items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 rounded-lg">
                            <Gamepad2 className="w-8 h-8 text-gray-400" />
                          </div>
                        </>
                      ) : (
                        <Gamepad2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {game.name}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{game.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{game.releaseDate ? formatDate(game.releaseDate) : 'Bilinmiyor'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{game.totalReviews || 0} değerlendirme</span>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {game.description}
                      </p>

                      {/* Genres and Themes */}
                      <div className="flex flex-wrap gap-2">
                        {game.genres?.slice(0, 3).map((genre: any) => (
                          <span
                            key={genre.id}
                            className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                          >
                            {genre.name}
                          </span>
                        ))}
                        {game.themes?.slice(0, 3).map((theme: any) => (
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
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
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

export default FilteredGamesPage;