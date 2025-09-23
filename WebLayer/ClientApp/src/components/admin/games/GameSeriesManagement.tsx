import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Eye, GamepadIcon, ArrowLeft, UserX, UserPlus, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GameSeries {
  id: number;
  name: string;
  description?: string;
  igdbId?: number;
  igdbName?: string;
  createdDate: string;
  gameCount: number;
}

interface CreateGameSeriesData {
  name: string;
  description?: string;
  igdbId?: number;
  igdbName?: string;
}

interface Game {
  id: number;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  releaseDate?: string;
  averageRating: number;
  ratingCount: number;
  gameSeriesId?: number;
  platforms: Array<{
    id: number;
    name: string;
  }>;
  genres: Array<{
    id: number;
    name: string;
  }>;
}

interface GameSeriesDetailModalProps {
  series: GameSeries;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSeries: () => void;
}

const GameSeriesManagement: React.FC = () => {
  const [gameSeries, setGameSeries] = useState<GameSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<GameSeries | null>(null);
  const [showSeriesDetail, setShowSeriesDetail] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<GameSeries | null>(null);
  
  const [formData, setFormData] = useState<CreateGameSeriesData>({
    name: '',
    description: '',
    igdbId: undefined,
    igdbName: ''
  });

  useEffect(() => {
    loadGameSeries();
  }, []);

  const loadGameSeries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5124/api/gameseries', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('GameSeries alınamadı');
      }

      const result = await response.json();
      setGameSeries(result.data || []);
    } catch (error: any) {
      toast.error(error.message || 'GameSeries yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Seri adı zorunludur');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5124/api/gameseries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: formData.name.trim(),
          Description: formData.description?.trim() || null,
          IGDBId: formData.igdbId || null,
          IGDBName: formData.igdbName?.trim() || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Seri oluşturulamadı');
      }

      toast.success('Oyun serisi başarıyla oluşturuldu!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', igdbId: undefined, igdbName: '' });
      loadGameSeries();
    } catch (error: any) {
      toast.error(error.message || 'Seri oluşturulurken hata oluştu');
    }
  };

  const handleUpdateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSeries) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/gameseries/${editingSeries.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: formData.name.trim(),
          Description: formData.description?.trim() || null,
          IGDBId: formData.igdbId || null,
          IGDBName: formData.igdbName?.trim() || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Seri güncellenemedi');
      }

      toast.success('Oyun serisi başarıyla güncellendi!');
      setEditingSeries(null);
      setFormData({ name: '', description: '', igdbId: undefined, igdbName: '' });
      loadGameSeries();
    } catch (error: any) {
      toast.error(error.message || 'Seri güncellenirken hata oluştu');
    }
  };

  const handleDeleteSeries = async (series: GameSeries) => {
    if (series.gameCount > 0) {
      toast.error(`Bu seriye bağlı ${series.gameCount} oyun var. Önce oyunları başka bir seriye taşıyın.`);
      return;
    }

    if (!window.confirm(`"${series.name}" serisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/gameseries/${series.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Seri silinemedi');
      }

      toast.success('Oyun serisi başarıyla silindi!');
      loadGameSeries();
    } catch (error: any) {
      toast.error(error.message || 'Seri silinirken hata oluştu');
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', igdbId: undefined, igdbName: '' });
    setEditingSeries(null);
    setShowCreateModal(true);
  };

  const openEditModal = (series: GameSeries) => {
    setFormData({
      name: series.name,
      description: series.description || '',
      igdbId: series.igdbId,
      igdbName: series.igdbName || ''
    });
    setEditingSeries(series);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingSeries(null);
    setFormData({ name: '', description: '', igdbId: undefined, igdbName: '' });
  };

  const openSeriesDetail = (series: GameSeries) => {
    setSelectedSeries(series);
    setShowSeriesDetail(true);
  };

  const closeSeriesDetail = () => {
    setShowSeriesDetail(false);
    setSelectedSeries(null);
  };

  const filteredSeries = gameSeries.filter(series =>
    series.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (series.description && series.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Oyun Serileri Yönetimi
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Oyunların dahil olduğu serileri yönetin
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Seri Ekle
          </button>
        </div>
        
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Seri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredSeries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz oyun serisi yok'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Farklı anahtar kelimeler deneyin' : 'İlk oyun serisini eklemek için "Yeni Seri Ekle" butonunu kullanın'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map((series) => (
              <div
                key={series.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                      <GamepadIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {series.name}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(series)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSeries(series)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    {series.gameCount} oyun
                  </span>
                  {series.igdbId && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                      IGDB
                    </span>
                  )}
                </div>


                {/* View Games Button */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => openSeriesDetail(series)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Oyunları Görüntüle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSeries ? 'Oyun Serisini Düzenle' : 'Yeni Oyun Serisi Ekle'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingSeries ? handleUpdateSeries : handleCreateSeries} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seri Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="Örn: The Elder Scrolls"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Seri hakkında kısa açıklama..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IGDB ID
                  </label>
                  <input
                    type="number"
                    value={formData.igdbId || ''}
                    onChange={(e) => setFormData({ ...formData, igdbId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IGDB Adı
                  </label>
                  <input
                    type="text"
                    value={formData.igdbName}
                    onChange={(e) => setFormData({ ...formData, igdbName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="IGDB'deki adı"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingSeries ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Game Series Detail Modal */}
      {showSeriesDetail && selectedSeries && (
        <GameSeriesDetailModal
          series={selectedSeries}
          isOpen={showSeriesDetail}
          onClose={closeSeriesDetail}
          onUpdateSeries={loadGameSeries}
        />
      )}
    </div>
  );
};

// GameSeriesDetailModal Component
const GameSeriesDetailModal: React.FC<GameSeriesDetailModalProps> = ({ 
  series, 
  isOpen, 
  onClose, 
  onUpdateSeries 
}) => {
  const [seriesGames, setSeriesGames] = useState<Game[]>([]);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && series) {
      loadSeriesGames();
      loadAvailableGames();
    }
  }, [isOpen, series]);

  const loadSeriesGames = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/games/series/${series.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Seri oyunları alınamadı');
      }

      const result = await response.json();
      setSeriesGames(result.data?.games || []);
    } catch (error: any) {
      toast.error(error.message || 'Seri oyunları yüklenirken hata oluştu');
    }
  };

  const loadAvailableGames = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/games?page=1&pageSize=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Oyunlar alınamadı');
      }

      const result = await response.json();
      const allGames = result.data?.data || [];
      
      // Only show games without a series (gameSeriesId is null or undefined)
      const gamesWithoutSeries = allGames.filter((game: Game) => !game.gameSeriesId);
      setAvailableGames(gamesWithoutSeries);
    } catch (error: any) {
      toast.error(error.message || 'Oyunlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const removeGameFromSeries = async (gameId: number) => {
    if (!window.confirm('Bu oyunu seriden çıkarmak istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameSeriesId: null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Oyun seriden çıkarılamadı');
      }

      toast.success('Oyun seriden çıkarıldı');
      loadSeriesGames();
      loadAvailableGames();
      onUpdateSeries(); // Update series count in parent
    } catch (error: any) {
      toast.error(error.message || 'Oyun seriden çıkarılırken hata oluştu');
    }
  };

  const addGameToSeries = async (gameId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameSeriesId: series.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Oyun seriye eklenemedi');
      }

      toast.success('Oyun seriye eklendi');
      loadSeriesGames();
      loadAvailableGames();
      onUpdateSeries(); // Update series count in parent
      setShowAddGameModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Oyun seriye eklenirken hata oluştu');
    }
  };

  const filteredAvailableGames = availableGames.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {series.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seri Oyunları Yönetimi
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddGameModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Oyun Ekle
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : seriesGames.length === 0 ? (
            <div className="text-center py-12">
              <GamepadIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Bu seride henüz oyun yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bu seriye oyun eklemek için "Oyun Ekle" butonunu kullanın
              </p>
              <button
                onClick={() => setShowAddGameModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                İlk Oyunu Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seriesGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    {game.coverImageUrl && (
                      <img
                        src={game.coverImageUrl}
                        alt={game.name}
                        className="w-16 h-20 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {game.name}
                      </h4>
                      <div className="flex items-center space-x-1 mt-1 mb-3">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {(game.averageRating || 0).toFixed(1)} ({game.ratingCount || 0})
                        </span>
                      </div>
                      <button
                        onClick={() => removeGameFromSeries(game.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <UserX className="w-3 h-3 mr-1" />
                        Seriden Çıkar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Game Modal */}
        {showAddGameModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Seriye Oyun Ekle
                </h3>
                <button
                  onClick={() => setShowAddGameModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Oyun ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filteredAvailableGames.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? 'Arama kriterlerine uygun oyun bulunamadı' : 'Seriye eklenebilecek oyun bulunamadı'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAvailableGames.map((game) => (
                        <div
                          key={game.id}
                          className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {game.coverImageUrl && (
                            <img
                              src={game.coverImageUrl}
                              alt={game.name}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {game.name}
                            </h4>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {(game.averageRating || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => addGameToSeries(game.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Ekle
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { GameSeriesManagement };
export default GameSeriesManagement;