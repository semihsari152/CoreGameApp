import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { GameEditModal } from './GameEditModal';
import GameSeriesManagement from './GameSeriesManagement';

interface Game {
  id: number;
  name: string;
  description?: string;
  summary?: string;
  coverImageUrl?: string;
  releaseDate?: string;
  averageRating: number;
  ratingCount: number;
  genres: Array<{
    id: number;
    name: string;
  }>;
  platforms: Array<{
    id: number;
    name: string;
  }>;
  themes?: Array<{
    id: number;
    name: string;
  }>;
  gameModes?: Array<{
    id: number;
    name: string;
  }>;
  playerPerspectives?: Array<{
    id: number;
    name: string;
  }>;
  igdbId?: number;
  createdDate: string;
  updatedDate?: string;
  isEarlyAccess: boolean;
  igdbUserRating?: number;
  igdbUserRatingCount?: number;
  igdbCriticsRating?: number;
  igdbCriticsRatingCount?: number;
  commentCount?: number;
  likeCount?: number;
}

export const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSeriesManagement, setShowSeriesManagement] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [igdbId, setIgdbId] = useState('');
  const [importing, setImporting] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'releaseDate' | 'averageRating' | 'createdDate'>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/games?page=1&pageSize=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Oyunlar alınamadı');
      }

      const result = await response.json();
      const games = result.data?.data || result.data || [];
      setGames(Array.isArray(games) ? games : []);
    } catch (error: any) {
      toast.error(error.message || 'Oyunlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const importGame = async () => {
    if (!igdbId || !igdbId.trim()) {
      toast.error('IGDB ID boş olamaz');
      return;
    }

    try {
      setImporting(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/ExternalApi/add-game/${igdbId.trim()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Oyun eklenemedi');
      }

      await response.json();
      toast.success('Oyun başarıyla eklendi!');
      setShowImportModal(false);
      setIgdbId('');
      loadGames(); // Oyun listesini yenile
    } catch (error: any) {
      toast.error(error.message || 'Oyun eklenirken hata oluştu');
    } finally {
      setImporting(false);
    }
  };

  const deleteGame = async (gameId: number) => {
    if (!window.confirm('Bu oyunu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Oyun silinemedi');
      }

      toast.success('Oyun silindi');
      loadGames();
    } catch (error: any) {
      toast.error(error.message || 'Oyun silinirken hata oluştu');
    }
  };

  const viewGameDetails = (game: Game) => {
    setSelectedGame(game);
    setShowDetailModal(true);
  };

  const editGame = (game: Game) => {
    setSelectedGame(game);
    setShowEditModal(true);
  };

  const handleSaveGame = async (gameData: any) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:5124/api/games/${gameData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Oyun güncellenemedi');
    }

    loadGames(); // Refresh the games list
  };

  const filteredAndSortedGames = games
    .filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.genres.some(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      game.platforms.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'releaseDate':
          aValue = new Date(a.releaseDate || '1900-01-01').getTime();
          bValue = new Date(b.releaseDate || '1900-01-01').getTime();
          break;
        case 'averageRating':
          aValue = a.averageRating || 0;
          bValue = b.averageRating || 0;
          break;
        case 'createdDate':
          aValue = new Date(a.createdDate).getTime();
          bValue = new Date(b.createdDate).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Oyun Yönetimi</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSeriesManagement(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Oyun Serileri
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            IGDB'den Oyun Ekle
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Oyun ara... (isim, tür, platform)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortField(field as any);
            setSortOrder(order as 'asc' | 'desc');
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="createdDate-desc">En Yeni Eklenenden</option>
          <option value="createdDate-asc">En Eski Eklenenden</option>
          <option value="name-asc">Ada Göre A-Z</option>
          <option value="name-desc">Ada Göre Z-A</option>
          <option value="averageRating-desc">En Yüksek Puan</option>
          <option value="averageRating-asc">En Düşük Puan</option>
          <option value="releaseDate-desc">En Yeni Çıkan</option>
          <option value="releaseDate-asc">En Eski Çıkan</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Oyun</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{games.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">IGDB Bağlantılı</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{games.filter(g => g.igdbId).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ortalama Puan</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {games.length > 0 ? (games.reduce((total, game) => total + (game.averageRating || 0), 0) / games.length).toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Erken Erişim</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{games.filter(g => g.isEarlyAccess).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Oyun Bilgileri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Yorum & Beğeni
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  IGDB Puanları
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Değerlendirme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedGames.map((game) => (
                <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">#{game.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {game.coverImageUrl && (
                        <img
                          className="h-12 w-12 rounded-lg object-cover mr-4 shadow-sm"
                          src={game.coverImageUrl}
                          alt={game.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <span className="truncate">{game.name}</span>
                          {game.isEarlyAccess && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              EA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {game.igdbId && (
                            <span className="inline-flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                              IGDB: {game.igdbId}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Çıkış: {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('tr-TR') : 'Belirsiz'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white space-y-2">
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <svg className="w-4 h-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                          </svg>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Yorum</span>
                        </div>
                        <span className="font-medium">
                          {game.commentCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">Beğeni</span>
                        </div>
                        <span className="font-medium">
                          {game.likeCount || 0}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white space-y-2">
                      {/* IGDB User Rating */}
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <svg className="w-4 h-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Users</span>
                        </div>
                        <span className="font-medium">
                          {game.igdbUserRating ? 
                            `${game.igdbUserRating.toFixed(1)}/10 ${game.igdbUserRatingCount ? `(${game.igdbUserRatingCount.toLocaleString()} users)` : ''}` 
                            : 'N/A'
                          }
                        </span>
                      </div>
                      
                      {/* IGDB Critics Rating */}
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Critics</span>
                        </div>
                        <span className="font-medium">
                          {game.igdbCriticsRating ? 
                            `${game.igdbCriticsRating.toFixed(1)}/10 ${game.igdbCriticsRatingCount ? `(${game.igdbCriticsRatingCount} users)` : ''}` 
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span className="font-medium">{(game.averageRating || 0).toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {game.ratingCount || 0} değerlendirme
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white space-y-1">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 w-12">Ekl:</span>
                        <span>
                          {game.createdDate ? new Date(game.createdDate).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2 w-12">Güncl:</span>
                        <span>
                          {game.updatedDate ? new Date(game.updatedDate).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {game.igdbId && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          IGDB Bağlı
                        </span>
                      )}
                      {game.isEarlyAccess && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          Erken Erişim
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => viewGameDetails(game)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Detayları Görüntüle"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detay
                      </button>
                      <button
                        onClick={() => editGame(game)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Düzenle"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Düzenle
                      </button>
                      <button
                        onClick={() => deleteGame(game.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Sil"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedGames.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Oyun bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Arama kriterlerinize uygun oyun bulunamadı.' : 'Henüz oyun yok. İlk oyunu eklemek için "IGDB\'den Oyun Ekle" butonunu kullanın.'}
            </p>
          </div>
        )}
      </div>

      {/* Import Game Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                IGDB'den Oyun Ekle
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Eklemek istediğiniz oyunun IGDB ID'sini girin. IGDB'de oyunu bulup URL'den ID'yi kopyalayabilirsiniz.
                </p>
                <input
                  type="number"
                  placeholder="IGDB ID (örnek: 1942)"
                  value={igdbId}
                  onChange={(e) => setIgdbId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Örnek: The Witcher 3 için ID: 1942
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={importGame}
                    disabled={importing}
                    className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Ekleniyor...' : 'Oyunu Ekle'}
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setIgdbId('');
                    }}
                    disabled={importing}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Detail Modal */}
      {showDetailModal && selectedGame && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white">
                {selectedGame.name} - Detaylar
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedGame(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Image */}
              <div className="md:col-span-1">
                {selectedGame.coverImageUrl && (
                  <img
                    className="w-full h-auto rounded-lg shadow-lg"
                    src={selectedGame.coverImageUrl}
                    alt={selectedGame.name}
                  />
                )}
              </div>
              
              {/* Right Columns - Details */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Temel Bilgiler</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Oyun ID</label>
                      <p className="text-sm text-gray-900 dark:text-white">#{selectedGame.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IGDB ID</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedGame.igdbId || 'Yok'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Çıkış Tarihi</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedGame.releaseDate ? new Date(selectedGame.releaseDate).toLocaleDateString('tr-TR') : 'Belirsiz'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Eklenme Tarihi</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedGame.createdDate && !isNaN(new Date(selectedGame.createdDate).getTime()) ? 
                          new Date(selectedGame.createdDate).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Bilinmiyor'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {(selectedGame.averageRating > 0 || selectedGame.ratingCount > 0) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Değerlendirme</h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <span className="text-yellow-400 text-2xl mr-2">★</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">
                          {(selectedGame.averageRating || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedGame.ratingCount || 0} kullanıcı değerlendirmesi
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedGame.summary && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Özet</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedGame.summary}
                    </p>
                  </div>
                )}
                
                {selectedGame.genres && selectedGame.genres.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Türler</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedGame.platforms && selectedGame.platforms.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Platformlar</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.platforms.map((platform) => (
                        <span
                          key={platform.id}
                          className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200"
                        >
                          {platform.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedGame.themes && selectedGame.themes.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Temalar</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.themes.map((theme) => (
                        <span
                          key={theme.id}
                          className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200"
                        >
                          {theme.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedGame.gameModes && selectedGame.gameModes.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Oyun Modları</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.gameModes.map((mode) => (
                        <span
                          key={mode.id}
                          className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full dark:bg-indigo-900 dark:text-indigo-200"
                        >
                          {mode.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedGame.playerPerspectives && selectedGame.playerPerspectives.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Oyuncu Perspektifleri</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.playerPerspectives.map((perspective) => (
                        <span
                          key={perspective.id}
                          className="px-3 py-1 text-sm font-medium bg-pink-100 text-pink-800 rounded-full dark:bg-pink-900 dark:text-pink-200"
                        >
                          {perspective.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {(selectedGame.igdbId || selectedGame.isEarlyAccess) && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Durum</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGame.igdbId && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          IGDB Bağlantısı Var
                        </span>
                      )}
                      {selectedGame.isEarlyAccess && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          Erken Erişim
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Edit Modal */}
      {showEditModal && selectedGame && (
        <GameEditModal
          game={selectedGame}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedGame(null);
          }}
          onSave={handleSaveGame}
        />
      )}

      {/* Game Series Management Modal */}
      {showSeriesManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-5/6 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Oyun Serileri Yönetimi
              </h2>
              <button
                onClick={() => setShowSeriesManagement(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-full">
              <GameSeriesManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManagement;