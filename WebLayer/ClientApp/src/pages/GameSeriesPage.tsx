import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gamesAPI } from '../services/api';
import { Game } from '../types';
import { 
  Calendar, 
  Star, 
  Users, 
  Gamepad2, 
  Clock,
  ArrowLeft,
  Filter,
  Grid,
  List
} from 'lucide-react';

interface GameSeriesData {
  series: {
    id: number;
    name: string;
    description?: string;
  };
  games: Game[];
}

const GameSeriesPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [seriesData, setSeriesData] = useState<GameSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'release' | 'rating' | 'name'>('release');

  useEffect(() => {
    const fetchSeriesData = async () => {
      if (!seriesId) return;
      
      try {
        setLoading(true);
        const data = await gamesAPI.getGamesBySeries(parseInt(seriesId));
        setSeriesData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load game series data');
        console.error('Error fetching series:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesData();
  }, [seriesId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const sortedGames = React.useMemo(() => {
    if (!seriesData?.games) return [];
    
    return [...seriesData.games].sort((a, b) => {
      switch (sortBy) {
        case 'release':
          if (!a.releaseDate) return 1;
          if (!b.releaseDate) return -1;
          return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [seriesData?.games, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span>Loading game series...</span>
        </div>
      </div>
    );
  }

  if (error || !seriesData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-400">{error || 'Game series not found'}</p>
          <Link to="/games" className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link to="/games" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Link>
          
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{seriesData.series.name}</h1>
              {seriesData.series.description && (
                <p className="text-gray-300 leading-relaxed max-w-3xl">
                  {seriesData.series.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Gamepad2 className="w-4 h-4" />
                  <span>{seriesData.games.length} games</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>
                    {seriesData.games.length > 0 
                      ? (seriesData.games.reduce((acc, game) => acc + (game.rating || 0), 0) / seriesData.games.length).toFixed(1)
                      : '0.0'
                    } avg rating
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {seriesData.games.length > 0 && seriesData.games[0]?.releaseDate
                      ? `Since ${new Date(seriesData.games[0].releaseDate).getFullYear()}`
                      : 'Various years'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Games in Series</h2>
          
          <div className="flex items-center space-x-4">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="release">Sort by Release Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="name">Sort by Name</option>
            </select>

            {/* View Mode */}
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-800'} hover:bg-blue-700 transition-colors`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-800'} hover:bg-blue-700 transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Games Display */}
        {sortedGames.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Games Found</h3>
            <p className="text-gray-400">This series doesn't have any games yet.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedGames.map((game) => (
              <Link
                key={game.id}
                to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group"
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={game.coverImageUrl || '/placeholder-game.jpg'}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {game.isEarlyAccess && (
                    <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                      Early Access
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{game.name}</h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>{formatDate(game.releaseDate)}</span>
                    {game.rating && game.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{game.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {game.platforms && game.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {game.platforms.slice(0, 3).map((platform) => (
                        <span
                          key={platform.id}
                          className="text-xs bg-gray-700 px-2 py-1 rounded"
                        >
                          {platform.name}
                        </span>
                      ))}
                      {game.platforms.length > 3 && (
                        <span className="text-xs text-gray-500">+{game.platforms.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGames.map((game) => (
              <Link
                key={game.id}
                to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
                className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
              >
                <div className="w-24 h-32 flex-shrink-0">
                  <img
                    src={game.coverImageUrl || '/placeholder-game.jpg'}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{game.name}</h3>
                      {game.summary && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{game.summary}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(game.releaseDate)}</span>
                        </div>
                        {game.rating && game.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{game.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {game.totalReviews && game.totalReviews > 0 && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{game.totalReviews} reviews</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {game.isEarlyAccess && (
                      <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded ml-4">
                        Early Access
                      </span>
                    )}
                  </div>
                  
                  {game.platforms && game.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {game.platforms.map((platform) => (
                        <span
                          key={platform.id}
                          className="text-xs bg-gray-700 px-2 py-1 rounded"
                        >
                          {platform.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSeriesPage;