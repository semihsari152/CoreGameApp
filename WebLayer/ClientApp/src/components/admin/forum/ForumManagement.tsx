import React, { useState, useEffect } from 'react';
import { AdminAuthService } from '../../../services/admin/adminAuthService';
import { toast } from 'react-hot-toast';
import { apiService as api } from '../../../services/api';
import { LikableType, CommentableType } from '../../../types';

interface ForumTopic {
  id: number;
  title: string;
  slug: string;
  content: string;
  isSticky: boolean;
  isLocked: boolean;
  isPublished: boolean;
  viewCount: number;
  replyCount: number;
  createdDate: string;
  updatedDate?: string;
  user: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  category: {
    id: number;
    name: string;
    color?: string;
  };
  game?: {
    id: number;
    name: string;
    coverImageUrl?: string;
    releaseDate: string;
  };
  tags: string[];
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  favoritesCount?: number;
}

interface ForumCategory {
  id: number;
  name: string;
  description: string;
  order: number;
  createdDate: string;
}

export const ForumManagement: React.FC = () => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'locked'>('all');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTopics(), loadCategories()]);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/forum/topics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Forum konuları alınamadı');
      }

      const result = await response.json();
      let topics = result.data?.data || [];
      
      // Fetch statistics for each forum topic
      if (topics && topics.length > 0) {
        const statsRequests = topics.map((topic: any) => ({
          likableType: LikableType.ForumTopic,
          commentableType: CommentableType.ForumTopic,
          entityId: topic.id
        }));
        
        try {
          const batchStats = await api.statistics.getBatchStats(statsRequests);
          
          topics = topics.map((topic: any) => ({
            ...topic,
            likeCount: batchStats[topic.id]?.likeCount || topic.likeCount || 0,
            dislikeCount: batchStats[topic.id]?.dislikeCount || topic.dislikeCount || 0,
            commentCount: batchStats[topic.id]?.commentCount || topic.commentCount || 0,
            likesCount: batchStats[topic.id]?.likeCount || topic.likesCount || 0,
            dislikesCount: batchStats[topic.id]?.dislikeCount || topic.dislikesCount || 0,
            commentsCount: batchStats[topic.id]?.commentCount || topic.commentsCount || 0,
            favoritesCount: topic.favoritesCount || 0
          }));
        } catch (error) {
          console.error('Error fetching statistics:', error);
        }
      }
      
      const topicsArray = topics;
      setTopics(Array.isArray(topicsArray) ? topicsArray : []);
    } catch (error: any) {
      toast.error(error.message || 'Forum konuları yüklenirken hata oluştu');
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/forum/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Forum kategorileri alınamadı');
      }

      const result = await response.json();
      const categories = result.data || [];
      setCategories(Array.isArray(categories) ? categories : []);
    } catch (error: any) {
      toast.error(error.message || 'Forum kategorileri yüklenirken hata oluştu');
    }
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const hideConfirmModal = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

  const getCategoryColor = (categoryName: string) => {
    const colors = [
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan  
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#3B82F6', // Blue
      '#EC4899', // Pink
      '#84CC16', // Lime
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#8B5A2B'  // Brown
    ];
    
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const togglePin = async (topicId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const topic = topics.find(t => t.id === topicId);
      const endpoint = topic?.isSticky ? 'unpin' : 'pin';
      
      const response = await fetch(`http://localhost:5124/api/Forum/topics/${topicId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Konu sabitleme durumu güncellenemedi');
      }

      toast.success('Konu sabitleme durumu güncellendi');
      loadTopics();
    } catch (error: any) {
      toast.error(error.message || 'Konu sabitleme durumu güncellenirken hata oluştu');
    }
  };

  const toggleLock = async (topicId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const topic = topics.find(t => t.id === topicId);
      const endpoint = topic?.isLocked ? 'unlock' : 'lock';
      
      const response = await fetch(`http://localhost:5124/api/Forum/topics/${topicId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Konu kilitleme durumu güncellenemedi');
      }

      toast.success('Konu kilitleme durumu güncellendi');
      loadTopics();
    } catch (error: any) {
      toast.error(error.message || 'Konu kilitleme durumu güncellenirken hata oluştu');
    }
  };

  const publishTopic = async (topicId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/Forum/${topicId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Konu yayına alınamadı');
      }

      toast.success('Konu yayına alındı');
      loadTopics();
    } catch (error: any) {
      toast.error(error.message || 'Konu yayına alınırken hata oluştu');
    }
  };

  const unpublishTopic = async (topicId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/Forum/${topicId}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Konu yayından kaldırılamadı');
      }

      toast.success('Konu yayından kaldırıldı');
      loadTopics();
    } catch (error: any) {
      toast.error(error.message || 'Konu yayından kaldırılırken hata oluştu');
    }
  };

  const deleteTopic = async (topicId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/Forum/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Konu silinemedi');
      }

      toast.success('Konu silindi');
      loadTopics();
    } catch (error: any) {
      toast.error(error.message || 'Konu silinirken hata oluştu');
    }
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || topic.category.id.toString() === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'published' && topic.isPublished) ||
                         (statusFilter === 'draft' && !topic.isPublished) ||
                         (statusFilter === 'locked' && topic.isLocked);
    return matchesSearch && matchesCategory && matchesStatus;
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Yönetimi</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Konu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.map(category => (
            <option key={category.id} value={category.id.toString()}>{category.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'locked')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="published">Yayınlanan</option>
          <option value="draft">Taslak</option>
          <option value="locked">Kilitli</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Konu</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{topics.length}</p>
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
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{topics.filter(t => t.isPublished).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-6a2 2 0 012-2h2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taslak</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{topics.filter(t => !t.isPublished).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sabitli</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{topics.filter(t => t.isSticky).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Konu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTopics.map((topic) => (
                <tr key={topic.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
                        {topic.isSticky ? (
                          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-white leading-5"
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
                          {topic.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {topic.user.avatarUrl && (
                        <img
                          className="h-6 w-6 rounded-full mr-2"
                          src={topic.user.avatarUrl}
                          alt={topic.user.username}
                        />
                      )}
                      <div className="text-sm text-gray-900 dark:text-white">{topic.user.username}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: topic.category.color || getCategoryColor(topic.category.name) }}
                    >
                      {topic.category.name}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {topic.game ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {topic.game.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>👀 {topic.viewCount || 0} görüntülenme</div>
                      <div>👍 {topic.likeCount || topic.likesCount || 0} - 👎 {topic.dislikeCount || topic.dislikesCount || 0}</div>
                      <div>💬 {topic.commentCount || topic.commentsCount || topic.replyCount || 0} yanıt</div>
                      <div>⭐ {topic.favoritesCount || 0} favori</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {topic.isSticky && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 w-fit">
                          Sabitli
                        </span>
                      )}
                      {topic.isLocked && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 w-fit">
                          Kilitli
                        </span>
                      )}
                      {(topic.isPublished !== false) ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-fit">
                          Yayında
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 w-fit">
                          Taslak
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>Oluşturuldu: {new Date(topic.createdDate).toLocaleDateString('tr-TR')}</div>
                      {topic.updatedDate && (
                        <div>Güncellendi: {new Date(topic.updatedDate).toLocaleDateString('tr-TR')}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex flex-col items-center space-y-2">
                      {/* Top row: Publish/Unpublish */}
                      <div className="w-full">
                        <button
                          onClick={() => showConfirmModal(
                            (topic.isPublished !== false) ? 'Yayından Kaldır' : 'Yayına Al',
                            `Bu konuyu ${(topic.isPublished !== false) ? 'yayından kaldırmak' : 'yayına almak'} istediğinize emin misiniz?`,
                            () => {
                              if (topic.isPublished !== false) {
                                unpublishTopic(topic.id);
                              } else {
                                publishTopic(topic.id);
                              }
                              hideConfirmModal();
                            }
                          )}
                          className={`w-full px-3 py-2 text-xs font-medium rounded-md shadow-sm transition-colors ${
                            (topic.isPublished !== false)
                              ? 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600'
                              : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
                          }`}
                        >
                          {(topic.isPublished !== false) ? '📤 Yayından Kaldır' : '📢 Yayına Al'}
                        </button>
                      </div>
                      
                      {/* Bottom row: Pin and Lock side by side */}
                      <div className="w-full flex space-x-1">
                        <button
                          onClick={() => showConfirmModal(
                            topic.isSticky ? 'Sabitlemeyi Kaldır' : 'Sabitle',
                            `Bu konuyu ${topic.isSticky ? 'sabitlemeyi kaldırmak' : 'sabitlemek'} istediğinize emin misiniz?`,
                            () => {
                              togglePin(topic.id);
                              hideConfirmModal();
                            }
                          )}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors ${
                            topic.isSticky
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500'
                              : 'bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                          }`}
                        >
                          {topic.isSticky ? '📌 Kaldır' : '📌 Sabitle'}
                        </button>
                        
                        <button
                          onClick={() => showConfirmModal(
                            topic.isLocked ? 'Kilidi Aç' : 'Kilitle',
                            `Bu konuyu ${topic.isLocked ? 'kilidini açmak' : 'kilitlemek'} istediğinize emin misiniz?`,
                            () => {
                              toggleLock(topic.id);
                              hideConfirmModal();
                            }
                          )}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors ${
                            topic.isLocked
                              ? 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500'
                              : 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500'
                          }`}
                        >
                          {topic.isLocked ? '🔓 Aç' : '🔒 Kilitle'}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Forum konusu bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' ? 'Arama kriterlerinize uygun konu bulunamadı.' : 'Henüz forum konusu yok.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg 
                  className="h-6 w-6 text-red-600 dark:text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-5 mb-6">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {confirmModal.message}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={hideConfirmModal}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-md transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumManagement;