import React, { useState, useEffect } from 'react';
import { AdminAuthService } from '../../../services/admin/adminAuthService';
import { toast } from 'react-hot-toast';
import { apiService as api } from '../../../services/api';
import { LikableType, CommentableType } from '../../../types';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImageUrl?: string;
  thumbnailUrl?: string;
  viewCount: number;
  isPublished: boolean;
  createdDate: string;
  updatedDate?: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  games: {
    id: number;
    name: string;
    coverImageUrl?: string;
  }[];
  category?: {
    id: number;
    name: string;
    description: string;
    color: string;
  };
  tags: string[];
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  favoritesCount?: number;
}

export const BlogManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/blogs?includeUnpublished=true&pageSize=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Blog yazıları alınamadı');
      }

      const result = await response.json();
      let blogs = result.data?.data || [];
      
      // Fetch statistics for each blog post (same as BlogPage.tsx)
      if (blogs && blogs.length > 0) {
        const statsRequests = blogs.map((blog: any) => ({
          likableType: LikableType.BlogPost,
          commentableType: CommentableType.BlogPost,
          entityId: blog.id
        }));
        
        try {
          const batchStats = await api.statistics.getBatchStats(statsRequests);
          
          // Merge statistics with blog data
          blogs = blogs.map((blog: any) => ({
            ...blog,
            likeCount: batchStats[blog.id]?.likeCount || blog.likeCount || 0,
            dislikeCount: batchStats[blog.id]?.dislikeCount || blog.dislikeCount || 0,
            commentCount: batchStats[blog.id]?.commentCount || blog.commentCount || 0,
            // Admin paneli için field names
            likesCount: batchStats[blog.id]?.likeCount || blog.likesCount || 0,
            dislikesCount: batchStats[blog.id]?.dislikeCount || blog.dislikesCount || 0,
            commentsCount: batchStats[blog.id]?.commentCount || blog.commentsCount || 0
          }));
        } catch (error) {
          
        }
      }
      
      setBlogs(Array.isArray(blogs) ? blogs : []);
    } catch (error: any) {
      toast.error(error.message || 'Blog yazıları yüklenirken hata oluştu');
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

  const unpublishBlog = async (blogId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/blogs/${blogId}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Blog yayından kaldırılamadı');
      }

      toast.success('Blog yayından kaldırıldı');
      loadBlogs();
      hideConfirmModal();
    } catch (error: any) {
      toast.error(error.message || 'Blog yayından kaldırılırken hata oluştu');
      hideConfirmModal();
    }
  };

  const publishBlog = async (blogId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/blogs/${blogId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Blog yayına alınamadı');
      }

      toast.success('Blog yayına alındı');
      loadBlogs();
      hideConfirmModal();
    } catch (error: any) {
      toast.error(error.message || 'Blog yayına alınırken hata oluştu');
      hideConfirmModal();
    }
  };

  const deleteBlog = async (blogId: number) => {
    if (!window.confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Blog silinemedi');
      }

      toast.success('Blog silindi');
      loadBlogs();
    } catch (error: any) {
      toast.error(error.message || 'Blog silinirken hata oluştu');
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.author.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && blog.isPublished) ||
                         (statusFilter === 'draft' && !blog.isPublished);
    return matchesSearch && matchesStatus;
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Yazıları Yönetimi</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Blog ara..."
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
          <option value="all">Tümü</option>
          <option value="published">Yayınlanan</option>
          <option value="draft">Taslak</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Görüntülenme</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{blogs.reduce((total, blog) => total + blog.viewCount, 0).toLocaleString()}</p>
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
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{blogs.filter(b => b.isPublished).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taslak</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{blogs.filter(b => !b.isPublished).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Blog</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{blogs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Başlık
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İstatistikler
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-lg object-cover mr-4"
                        src={blog.coverImageUrl || '/icons/blog-default.svg'}
                        alt={blog.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/icons/blog-default.svg';
                        }}
                      />
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
                          {blog.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {blog.author.avatarUrl && (
                        <img
                          className="h-6 w-6 rounded-full mr-2"
                          src={blog.author.avatarUrl}
                          alt={blog.author.username}
                        />
                      )}
                      <div className="text-sm text-gray-900 dark:text-white">{blog.author.username}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {blog.category ? (
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        style={{
                          backgroundColor: `${blog.category.color}20`,
                          color: blog.category.color,
                          border: `1px solid ${blog.category.color}30`
                        }}
                      >
                        {blog.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Kategori yok</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {blog.games && blog.games.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {blog.games.map((game, index) => (
                          <span 
                            key={game.id}
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {game.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Oyun yok</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>👀 {blog.viewCount || 0} görüntülenme</div>
                      <div>👍 {blog.likesCount || 0} - 👎 {blog.dislikesCount || 0}</div>
                      <div>💬 {blog.commentsCount || 0} yorum</div>
                      <div>⭐ {blog.favoritesCount || 0} favori</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {blog.isPublished ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Yayında
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Taslak
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>Oluşturuldu: {new Date(blog.createdDate).toLocaleDateString('tr-TR')}</div>
                      {blog.updatedDate && (
                        <div>Güncellendi: {new Date(blog.updatedDate).toLocaleDateString('tr-TR')}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {blog.isPublished ? (
                      <button
                        onClick={() => showConfirmModal(
                          'Blog Yayından Kaldır',
                          'Bu blog yazısını yayından kaldırmak istediğinize emin misiniz?',
                          () => unpublishBlog(blog.id)
                        )}
                        className="px-3 py-1 text-xs font-medium rounded border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Yayından Kaldır
                      </button>
                    ) : (
                      <button
                        onClick={() => showConfirmModal(
                          'Blog Yayına Al',
                          'Bu blog yazısını yayına almak istediğinize emin misiniz?',
                          () => publishBlog(blog.id)
                        )}
                        className="px-3 py-1 text-xs font-medium rounded border border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        Yayına Al
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Blog bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' ? 'Arama kriterlerinize uygun blog bulunamadı.' : 'Henüz blog yazısı yok.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {confirmModal.title}
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={hideConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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

export default BlogManagement;