import React, { useState, useEffect } from 'react';
import { AdminAuthService } from '../../../services/admin/adminAuthService';
import { toast } from 'react-hot-toast';
import { apiService as api } from '../../../services/api';
import { LikableType, CommentableType } from '../../../types';

interface Guide {
  id: number;
  title: string;
  slug: string;
  summary: string;
  viewCount: number;
  averageRating: number;
  ratingCount: number;
  createdDate: string;
  updatedDate?: string;
  difficulty: string;
  guideCategoryId?: number;
  guideCategory?: {
    id: number;
    name: string;
    iconClass: string;
    color?: string;
  };
  tags: string[];
  user: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  game?: {
    id: number;
    name: string;
    coverImageUrl?: string;
  };
  thumbnailUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  favoritesCount?: number;
}

export const GuideManagement: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/guides?includeUnpublished=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Rehberler alınamadı');
      }

      const result = await response.json();
      let guides = result.data || [];
      
      // Fetch statistics for each guide
      if (guides && guides.length > 0) {
        const statsRequests = guides.map((guide: any) => ({
          likableType: LikableType.Guide,
          commentableType: CommentableType.Guide,
          entityId: guide.id
        }));
        
        try {
          const batchStats = await api.statistics.getBatchStats(statsRequests);
          
          guides = guides.map((guide: any) => ({
            ...guide,
            likesCount: batchStats[guide.id]?.likeCount || guide.likesCount || 0,
            dislikesCount: batchStats[guide.id]?.dislikeCount || guide.dislikesCount || 0,
            commentsCount: batchStats[guide.id]?.commentCount || guide.commentsCount || 0,
            favoritesCount: guide.favoritesCount || 0
          }));
        } catch (error) {
          
        }
      }
      const guidesArray = guides;
      
      setGuides(Array.isArray(guidesArray) ? guidesArray : []);
    } catch (error: any) {
      toast.error(error.message || 'Rehberler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const hideConfirmModal = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

  const unpublishGuide = async (guideId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/guides/${guideId}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Rehber yayından kaldırılamadı');
      }

      toast.success('Rehber yayından kaldırıldı');
      loadGuides();
      hideConfirmModal();
    } catch (error: any) {
      toast.error(error.message || 'Rehber yayından kaldırılırken hata oluştu');
      hideConfirmModal();
    }
  };

  const publishGuide = async (guideId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/guides/${guideId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Rehber yayına alınamadı');
      }

      toast.success('Rehber yayına alındı');
      loadGuides();
      hideConfirmModal();
    } catch (error: any) {
      toast.error(error.message || 'Rehber yayına alınırken hata oluştu');
      hideConfirmModal();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'kolay':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
      case 'orta':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
      case 'zor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expert':
      case 'çok zor':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'Başlangıç';
      case 'intermediate':
        return 'Orta';
      case 'advanced':
        return 'İleri';
      case 'expert':
        return 'Uzman';
      default:
        return difficulty;
    }
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guide.game?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && guide.isPublished) ||
                         (statusFilter === 'draft' && !guide.isPublished);
    const matchesDifficulty = difficultyFilter === 'all' ||
                             guide.difficulty.toLowerCase() === difficultyFilter;
    return matchesSearch && matchesStatus && matchesDifficulty;
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rehber Yönetimi</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rehber ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="published">Yayınlanan</option>
          <option value="draft">Taslak</option>
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as 'all' | 'beginner' | 'intermediate' | 'advanced')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tüm Seviyeler</option>
          <option value="beginner">Başlangıç</option>
          <option value="intermediate">Orta</option>
          <option value="advanced">İleri</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Rehber</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{guides.length}</p>
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Yayınlanan</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{guides.filter(g => g.isPublished).length}</p>
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
                {guides.length > 0 ? (guides.reduce((total, guide) => total + guide.averageRating, 0) / guides.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Görüntülenme</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{guides.reduce((total, guide) => total + guide.viewCount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guide List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rehber
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yazar
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Oyun
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İstatistikler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGuides.map((guide) => (
                <tr key={guide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {guide.thumbnailUrl ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover mr-4"
                          src={guide.thumbnailUrl}
                          alt={guide.title}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-white"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: '280px',
                            minHeight: '2.5rem',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}
                        >
                          {guide.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {guide.user.avatarUrl && (
                        <img
                          className="h-6 w-6 rounded-full mr-2"
                          src={guide.user.avatarUrl}
                          alt={guide.user.username}
                        />
                      )}
                      <div className="text-sm text-gray-900 dark:text-white">{guide.user.username}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {guide.guideCategory ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        {guide.guideCategory.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {guide.game ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {guide.game.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>👀 {guide.viewCount || 0} görüntülenme</div>
                      <div>👍 {guide.likesCount || 0} - 👎 {guide.dislikesCount || 0}</div>
                      <div>💬 {guide.commentsCount || 0} yorum</div>
                      <div>⭐ {guide.favoritesCount || 0} favori</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guide.isPublished ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Yayında
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Taslak
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>Oluşturuldu: {new Date(guide.createdDate).toLocaleDateString('tr-TR')}</div>
                      {guide.updatedDate && (
                        <div>Güncellendi: {new Date(guide.updatedDate).toLocaleDateString('tr-TR')}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {guide.isPublished ? (
                        <button
                          onClick={() => showConfirmModal(
                            'Rehberi Yayından Kaldır',
                            'Bu rehberi yayından kaldırmak istediğinize emin misiniz?',
                            () => unpublishGuide(guide.id)
                          )}
                          className="px-3 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          Yayından Kaldır
                        </button>
                      ) : (
                        <button
                          onClick={() => showConfirmModal(
                            'Rehberi Yayına Al',
                            'Bu rehberi yayına almak istediğinize emin misiniz?',
                            () => publishGuide(guide.id)
                          )}
                          className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                        >
                          Yayına Al
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Rehber bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || difficultyFilter !== 'all' ? 'Arama kriterlerinize uygun rehber bulunamadı.' : 'Henüz rehber yok.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={hideConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideManagement;