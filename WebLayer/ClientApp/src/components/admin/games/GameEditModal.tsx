import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Plus, Trash2, ExternalLink, Tag, Monitor, Gamepad2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../../services/api';

interface GameSeries {
  id: number;
  name: string;
  description?: string;
}

interface SelectOption {
  id: number;
  name: string;
}

interface GameEditData {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  summary?: string;
  storyline?: string;
  releaseDate?: string;
  publisher?: string;
  developer?: string;
  isEarlyAccess: boolean;
  metacriticScore?: number;
  igdbId?: number;
  igdbSlug?: string;
  igdbUrl?: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  officialWebsite?: string;
  gameSeriesId?: number;
  platforms?: Array<{ id: number; name: string }>;
  genres?: Array<{ id: number; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  gameModes?: Array<{ id: number; name: string }>;
  playerPerspectives?: Array<{ id: number; name: string }>;
  keywords?: Array<{ id: number; name: string }>;
  websites?: Array<{ id: number; url: string; category: string; name?: string }>;
  screenshots?: string[];
}

interface GameEditModalProps {
  game: GameEditData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: GameEditData) => Promise<void>;
}

export const GameEditModal: React.FC<GameEditModalProps> = ({
  game,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<GameEditData>(game);
  const [gameSeries, setGameSeries] = useState<GameSeries[]>([]);
  const [allPlatforms, setAllPlatforms] = useState<SelectOption[]>([]);
  const [allGenres, setAllGenres] = useState<SelectOption[]>([]);
  const [allThemes, setAllThemes] = useState<SelectOption[]>([]);
  const [allGameModes, setAllGameModes] = useState<SelectOption[]>([]);
  const [allPlayerPerspectives, setAllPlayerPerspectives] = useState<SelectOption[]>([]);
  const [allKeywords, setAllKeywords] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newScreenshot, setNewScreenshot] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [newWebsiteCategory, setNewWebsiteCategory] = useState('');

  const loadDetailedGameData = useCallback(async (slug: string) => {
    setDetailLoading(true);
    try {
      // Use the same API that game detail page uses
      const detailedGame = await apiService.games.getBySlug(slug);
      
      // Transform the detailed game data to our form format
      setFormData({
        id: detailedGame.id,
        name: detailedGame.name || '',
        slug: detailedGame.slug || '',
        description: detailedGame.description || '',
        summary: detailedGame.summary || '',
        storyline: detailedGame.storyline || '',
        releaseDate: detailedGame.releaseDate || '',
        publisher: detailedGame.publisher || '',
        developer: detailedGame.developer || '',
        isEarlyAccess: detailedGame.isEarlyAccess || false,
        igdbId: detailedGame.igdbId,
        igdbSlug: detailedGame.igdbSlug || '',
        igdbUrl: detailedGame.igdbUrl || '',
        coverImageUrl: detailedGame.coverImageUrl || '',
        gameSeriesId: detailedGame.gameSeries?.id,
        platforms: detailedGame.platforms ? Array.from(detailedGame.platforms) : [],
        genres: detailedGame.genres ? Array.from(detailedGame.genres) : [],
        themes: detailedGame.themes ? Array.from(detailedGame.themes) : [],
        gameModes: detailedGame.gameModes ? Array.from(detailedGame.gameModes) : [],
        playerPerspectives: detailedGame.playerPerspectives ? Array.from(detailedGame.playerPerspectives) : [],
        keywords: detailedGame.keywords ? Array.from(detailedGame.keywords) : [],
        websites: detailedGame.websites ? Array.from(detailedGame.websites) : [],
        screenshots: detailedGame.screenshots ? Array.from(detailedGame.screenshots) : []
      });
    } catch (error) {
      console.error('Failed to load detailed game data:', error);
      toast.error('Oyun detayları yüklenemedi');
      // Fallback to basic game data
      setFormData(game);
    } finally {
      setDetailLoading(false);
    }
  }, [game]);

  useEffect(() => {
    if (game.slug) {
      loadDetailedGameData(game.slug);
    } else {
      setFormData(game);
    }
    loadAllData();
  }, [game, loadDetailedGameData]);

  const loadAllData = async () => {
    try {
      // Load existing data with what we know works
      const [genresData, tagsData] = await Promise.allSettled([
        apiService.genres.getAll(),
        apiService.tags.getAll()
      ]);

      if (genresData.status === 'fulfilled') {
        setAllGenres(genresData.value || []);
      }

      if (tagsData.status === 'fulfilled') {
        setAllKeywords(tagsData.value || []);
      }

      // Load platforms, themes, gameModes from new APIs
      try {
        const platformsData = await apiService.platforms.getAll();
        setAllPlatforms(platformsData || []);
      } catch (error) {
        console.log('Platforms API not available');
      }

      try {
        const themesData = await apiService.themes.getAll();
        setAllThemes(themesData || []);
      } catch (error) {
        console.log('Themes API not available');
      }

      try {
        const gameModesData = await apiService.gameModes.getAll();
        setAllGameModes(gameModesData || []);
      } catch (error) {
        console.log('GameModes API not available');
      }

      try {
        const gameSeriesData = await apiService.gameSeries.getAll();
        setGameSeries(gameSeriesData || []);
      } catch (error) {
        console.log('GameSeries API not available');
      }

      try {
        const playerPerspectivesData = await apiService.playerPerspectives.getAll();
        setAllPlayerPerspectives(playerPerspectivesData || []);
      } catch (error) {
        console.log('PlayerPerspectives API not available');
      }

    } catch (error) {
      console.error('Lookup data yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      onClose();
      toast.success('Oyun başarıyla güncellendi!');
    } catch (error: any) {
      toast.error(error.message || 'Oyun güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GameEditData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelectChange = (field: keyof GameEditData, selectedIds: number[]) => {
    let fieldOptions: SelectOption[] = [];
    
    switch (field) {
      case 'platforms':
        fieldOptions = allPlatforms;
        break;
      case 'genres':
        fieldOptions = allGenres;
        break;
      case 'themes':
        fieldOptions = allThemes;
        break;
      case 'gameModes':
        fieldOptions = allGameModes;
        break;
      case 'playerPerspectives':
        fieldOptions = allPlayerPerspectives;
        break;
      case 'keywords':
        fieldOptions = allKeywords;
        break;
      default:
        return;
    }

    const selectedItems = selectedIds.map(id => {
      const item = fieldOptions.find(option => option.id === id);
      return item ? { id: item.id, name: item.name } : null;
    }).filter(Boolean) as Array<{ id: number; name: string }>;

    handleInputChange(field, selectedItems);
  };

  const addScreenshot = () => {
    if (!newScreenshot.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      screenshots: [...(prev.screenshots || []), newScreenshot]
    }));
    setNewScreenshot('');
  };

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots?.filter((_, i) => i !== index) || []
    }));
  };

  const addWebsite = () => {
    if (!newWebsiteUrl.trim() || !newWebsiteCategory.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      websites: [...(prev.websites || []), {
        id: Date.now(), // Temporary ID for new websites
        url: newWebsiteUrl,
        category: newWebsiteCategory
      }]
    }));
    setNewWebsiteUrl('');
    setNewWebsiteCategory('');
  };

  const removeWebsite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      websites: prev.websites?.filter((_, i) => i !== index) || []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden border border-gray-200/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                Oyun Düzenle
              </h2>
              <p className="text-blue-100/90 text-lg font-medium">
                {game.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
          <form onSubmit={handleSubmit} className="p-8">
            {detailLoading && (
              <div className="flex items-center justify-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl mb-8">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500/30 border-t-blue-500"></div>
                <span className="ml-4 text-lg text-gray-700 dark:text-gray-300 font-medium">Detaylı oyun bilgileri yükleniyor...</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
              {/* Sol Alan - Temel Bilgiler */}
              <div className="2xl:col-span-2 space-y-8">
                {/* Temel Bilgiler */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl mr-4">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    Temel Bilgiler
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Oyun Adı
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Slug
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Geliştirici
                      </label>
                      <input
                        type="text"
                        name="developer"
                        value={formData.developer}
                        onChange={(e) => handleInputChange('developer', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Yayıncı
                      </label>
                      <input
                        type="text"
                        name="publisher"
                        value={formData.publisher}
                        onChange={(e) => handleInputChange('publisher', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                    </div>


                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        IGDB ID
                      </label>
                      <input
                        type="number"
                        name="igdbId"
                        value={formData.igdbId || ''}
                        onChange={(e) => handleInputChange('igdbId', parseInt(e.target.value) || undefined)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        IGDB Slug
                      </label>
                      <input
                        type="text"
                        name="igdbSlug"
                        value={formData.igdbSlug}
                        onChange={(e) => handleInputChange('igdbSlug', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      IGDB URL
                    </label>
                    <input
                      type="url"
                      name="igdbUrl"
                      value={formData.igdbUrl}
                      onChange={(e) => handleInputChange('igdbUrl', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                    />
                  </div>
                </div>

                {/* Game Series */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-2 rounded-xl mr-4">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Oyun Serisi
                  </h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <select
                        value={formData.gameSeriesId || ''}
                        onChange={(e) => handleInputChange('gameSeriesId', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      >
                        <option value="">Oyun serisi seçin...</option>
                        {gameSeries.map((series) => (
                          <option key={series.id} value={series.id}>
                            {series.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {formData.gameSeriesId ? 'Seçili seri mevcut' : 'Seri seçilmedi'}
                    </div>
                  </div>
                </div>

                {/* Açıklama ve Hikaye */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-xl mr-4">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    Açıklama ve Hikaye
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Özet (Summary)
                      </label>
                      <textarea
                        name="summary"
                        value={formData.summary}
                        onChange={(e) => handleInputChange('summary', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-vertical shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                        placeholder="Oyunun kısa özeti..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Açıklama (Description)
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-vertical shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                        placeholder="Oyunun detaylı açıklaması..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Hikaye (Storyline)
                      </label>
                      <textarea
                        name="storyline"
                        value={formData.storyline}
                        onChange={(e) => handleInputChange('storyline', e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-vertical shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                        placeholder="Oyunun hikayesi..."
                      />
                    </div>
                  </div>
                </div>

                {/* Kategoriler ve Etiketler */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-4">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    Kategoriler ve Etiketler
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Genres */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Türler (Genres)
                      </label>
                      <div className="max-h-48 overflow-y-auto border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-inner hover:border-gray-400/50 dark:hover:border-gray-500/50 transition-all duration-200">
                        {allGenres.map(genre => (
                          <label key={genre.id} className="flex items-center mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.genres?.some(g => g.id === genre.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.genres?.map(g => g.id) || [];
                                const newIds = e.target.checked 
                                  ? [...currentIds, genre.id]
                                  : currentIds.filter(id => id !== genre.id);
                                handleMultiSelectChange('genres', newIds);
                              }}
                              className="mr-3 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{genre.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Platformlar (Platforms)
                      </label>
                      <div className="max-h-48 overflow-y-auto border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-inner hover:border-gray-400/50 dark:hover:border-gray-500/50 transition-all duration-200">
                        {allPlatforms.map(platform => (
                          <label key={platform.id} className="flex items-center mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.platforms?.some(p => p.id === platform.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.platforms?.map(p => p.id) || [];
                                const newIds = e.target.checked 
                                  ? [...currentIds, platform.id]
                                  : currentIds.filter(id => id !== platform.id);
                                handleMultiSelectChange('platforms', newIds);
                              }}
                              className="mr-3 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{platform.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Themes */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Temalar (Themes)
                      </label>
                      <div className="max-h-48 overflow-y-auto border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-inner hover:border-gray-400/50 dark:hover:border-gray-500/50 transition-all duration-200">
                        {allThemes.map(theme => (
                          <label key={theme.id} className="flex items-center mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.themes?.some(t => t.id === theme.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.themes?.map(t => t.id) || [];
                                const newIds = e.target.checked 
                                  ? [...currentIds, theme.id]
                                  : currentIds.filter(id => id !== theme.id);
                                handleMultiSelectChange('themes', newIds);
                              }}
                              className="mr-3 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{theme.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Game Modes */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Oyun Modları (Game Modes)
                      </label>
                      <div className="max-h-48 overflow-y-auto border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-inner hover:border-gray-400/50 dark:hover:border-gray-500/50 transition-all duration-200">
                        {allGameModes.map(mode => (
                          <label key={mode.id} className="flex items-center mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.gameModes?.some(m => m.id === mode.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.gameModes?.map(m => m.id) || [];
                                const newIds = e.target.checked 
                                  ? [...currentIds, mode.id]
                                  : currentIds.filter(id => id !== mode.id);
                                handleMultiSelectChange('gameModes', newIds);
                              }}
                              className="mr-3 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mode.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Player Perspectives */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        Oyuncu Perspektifleri
                      </label>
                      <div className="max-h-48 overflow-y-auto border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-inner hover:border-gray-400/50 dark:hover:border-gray-500/50 transition-all duration-200">
                        {allPlayerPerspectives.map(perspective => (
                          <label key={perspective.id} className="flex items-center mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.playerPerspectives?.some(p => p.id === perspective.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.playerPerspectives?.map(p => p.id) || [];
                                const newIds = e.target.checked 
                                  ? [...currentIds, perspective.id]
                                  : currentIds.filter(id => id !== perspective.id);
                                handleMultiSelectChange('playerPerspectives', newIds);
                              }}
                              className="mr-3 w-4 h-4 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{perspective.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Sağ Alan - Medya ve Linkler */}
              <div className="2xl:col-span-2 space-y-8">
                {/* Web Siteleri */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl mr-4">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                    Web Siteleri
                  </h3>
                  
                  <div className="space-y-4">
                    {formData.websites && formData.websites.length > 0 ? (
                      formData.websites.map((website, index) => (
                        <div key={index} className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{website.category}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{website.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeWebsite(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8 italic">Henüz web sitesi eklenmemiş</p>
                    )}
                    
                    <div className="flex gap-3 mt-6">
                      <input
                        type="url"
                        value={newWebsiteUrl}
                        onChange={(e) => setNewWebsiteUrl(e.target.value)}
                        placeholder="Web sitesi URL'si"
                        className="flex-1 px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                      <input
                        type="text"
                        value={newWebsiteCategory}
                        onChange={(e) => setNewWebsiteCategory(e.target.value)}
                        placeholder="Kategori"
                        className="w-36 px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                      />
                      <button
                        type="button"
                        onClick={addWebsite}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ekran Görüntüleri */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-2 rounded-xl mr-4">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    Ekran Görüntüleri
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {formData.screenshots && formData.screenshots.length > 0 ? (
                      formData.screenshots.map((screenshot, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={screenshot} 
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200"></div>
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-full text-gray-500 dark:text-gray-400 text-center py-12 italic">Henüz ekran görüntüsü eklenmemiş</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={newScreenshot}
                      onChange={(e) => setNewScreenshot(e.target.value)}
                      placeholder="Ekran görüntüsü URL'si"
                      className="flex-1 px-4 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-400/50 dark:hover:border-gray-500/50"
                    />
                    <button
                      type="button"
                      onClick={addScreenshot}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Keywords/Tags */}
                <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-4">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    Anahtar Kelimeler (Tags)
                  </h3>
                  
                  <div className="border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl p-6 bg-white dark:bg-gray-800 min-h-[120px] shadow-inner hover:border-gray-400/50 dark:hover:border-gray-500/50 transition-all duration-200">
                    {formData.keywords && formData.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {formData.keywords.map(keyword => (
                          <span 
                            key={keyword.id} 
                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {keyword.name}
                            <button
                              type="button"
                              onClick={() => {
                                const newKeywords = formData.keywords?.filter(k => k.id !== keyword.id) || [];
                                setFormData(prev => ({ ...prev, keywords: newKeywords }));
                              }}
                              className="ml-2 text-blue-200 hover:text-red-300 hover:bg-red-500/20 p-1 rounded-full transition-all duration-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8 italic">Bu oyuna ait anahtar kelime bulunamadı</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 px-8 py-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-3" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};