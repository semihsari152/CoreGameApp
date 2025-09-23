import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Calendar, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Edit, 
  Trash2, 
  Pin, 
  Lock, 
  Unlock, 
  MoreVertical,
  Send,
  Heart,
  Star,
  Flag
} from 'lucide-react';
import { apiService as api, commentsAPIExtended } from '../services/api';
import { ForumTopic, Comment, CommentableType, LikableType, ReportableType, FavoriteType } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import CommentSection from '../components/comments/CommentSection';
import LikeButton from '../components/common/LikeButton';
import FavoriteButton from '../components/common/FavoriteButton';
import ReportButton from '../components/common/ReportButton';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

const ForumTopicDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  

  // Fetch topic details
  const { data: topic, isLoading: topicLoading, error } = useQuery({
    queryKey: ['forum-topic', id || slug],
    queryFn: () => {
      if (slug) {
        return api.forum.getTopicBySlug(slug);
      } else if (id) {
        return api.forum.getTopicById(parseInt(id));
      }
      throw new Error('No id or slug provided');
    },
    enabled: !!(id || slug)
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: () => api.forum.deleteTopic(topic?.id || parseInt(id!)),
    onSuccess: () => {
      toast.success('Forum konusu başarıyla silindi!');
      navigate('/forum');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Konu silinirken bir hata oluştu');
    }
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteTopicMutation.mutate();
    setShowDeleteModal(false);
  };

  if (topicLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded w-1/4 mb-6"></div>
            <div className="card p-8">
              <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/2 mb-6"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Konu Bulunamadı
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aradığınız forum konusu bulunamadı veya erişiminiz yok.
            </p>
            <Link to="/forum" className="btn-primary">
              Forum'a Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          to="/forum"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Forum'a Dön
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Topic Header */}
            <div className="card p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                {topic.isSticky && (
                  <Pin className="w-4 h-4 text-green-600" />
                )}
                {topic.isLocked && (
                  <Lock className="w-4 h-4 text-red-600" />
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {topic.category?.name}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-break">
                {topic.title}
              </h1>

              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Link 
                  to={`/profile/${topic.user?.username}`}
                  className="flex items-center space-x-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{topic.user?.username}</span>
                </Link>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{topic.createdDate ? formatDate(topic.createdDate) : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{topic.viewCount} görüntüleme</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{topic.replyCount} yanıt</span>
                </div>
              </div>


              {/* Tags */}
              {topic.tags && topic.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {topic.tags.map((tag: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons - only show if user is logged in and is the topic author */}
            {isAuthenticated && (user?.id === topic?.userId || user?.id === topic?.user?.id) && (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/forum/topic/edit/${topic?.id}`}
                  className="btn-secondary text-sm"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button 
                  onClick={handleDeleteClick}
                  className="btn-secondary text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {/* Like/Dislike */}
              <LikeButton
                entityType={LikableType.ForumTopic}
                entityId={topic.id}
                variant="default"
                size="md"
                showCounts={true}
                className="[&_button]:px-3 [&_button]:py-2 [&_button]:font-medium"
              />
              
              {/* Favorite */}
              <FavoriteButton
                entityType={FavoriteType.ForumTopic}
                entityId={topic.id}
                variant="heart"
                size="sm"
                showText={true}
                className="px-4 py-2 rounded-lg font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all duration-200"
              />
              
              {/* Report */}
              <ReportButton
                entityType={ReportableType.ForumTopic}
                entityId={topic.id}
                entityTitle={topic.title}
                variant="button"
                className="px-4 py-2 rounded-lg font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-200"
              />
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Son güncelleme: {topic.updatedDate ? formatDate(topic.updatedDate) : (topic.createdDate ? formatDate(topic.createdDate) : 'Bilinmiyor')}
            </div>
          </div>

          {/* Topic Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none mt-8">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-break">
              {topic.content?.split('\n\n').map((block, index) => {
                // Check if block is an image
                const imageMatch = block.match(/\[image\](.*?)\[\/image\]/);
                if (imageMatch) {
                  const imageUrl = imageMatch[1];
                  return (
                    <div key={index} className="my-4">
                      <img
                        src={imageUrl}
                        alt="Forum görseli"
                        className="max-w-full h-auto rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  );
                }
                // Regular text block
                return (
                  <div key={index} className="mb-4">
                    {block}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {!topic.isLocked ? (
          <CommentSection 
            entityType={CommentableType.ForumTopic}
            entityId={topic.id}
            entityTitle={topic.title}
            postAuthorId={topic.userId || topic.author?.id || topic.user?.id}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Lock className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Bu konu kilitlenmiş, yeni yanıt verilemez.
            </p>
          </div>
        )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Topic Author */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              Konu Sahibi
            </h3>
            <Link 
              to={`/profile/${topic.user?.username}`}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 overflow-hidden">
                {topic.user?.avatarUrl ? (
                  <img 
                    src={topic.user.avatarUrl} 
                    alt={topic.user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-lg font-bold">${topic.user?.username?.charAt(0).toUpperCase()}</span>`;
                    }}
                  />
                ) : (
                  <span>{topic.user?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{topic.user?.username}</h4>
              </div>
            </Link>
          </div>


          {/* Category Info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Kategori
            </h3>
            <Link 
              to={`/forum?categoryId=${topic.category?.id}`}
              className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer hover:scale-105 transform duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {topic.category?.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {topic.category?.description || "Bu kategori için henüz açıklama eklenmemiş."}
                </p>
              </div>
            </Link>
          </div>

          {/* Game Info - moved to sidebar */}
          {topic.game && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                İlgili Oyun
              </h3>
              <Link
                to={topic.game.slug ? `/games/${topic.game.slug}` : `/games/${topic.game.id}`}
                className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                title={topic.game.slug ? `/games/${topic.game.slug}` : `/games/${topic.game.id}`}
              >
                <div className="flex items-start space-x-4">
                  {/* Oyun kapak resmi */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
                      {topic.game.coverImageUrl ? (
                        <img
                          src={topic.game.coverImageUrl}
                          alt={topic.game.name}
                          className="w-full h-full object-cover"
                          onLoad={() => console.log('Image loaded:', topic.game?.coverImageUrl)}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement!;
                            parent.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600', 'flex', 'items-center', 'justify-center');
                            parent.innerHTML = `
                              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Oyun bilgileri */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                      {topic.game.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {topic.game.releaseDate ? new Date(topic.game.releaseDate).getFullYear() : 'TBA'}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                      Detayları Gör →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Similar Topics */}
          <div className="card p-6">
            <h3 className="font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Benzer Konular
            </h3>
            <div className="space-y-4">
              <Link to="/forum/topic/1" className="block group">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 border border-blue-100 dark:border-blue-800 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 line-clamp-2 text-sm mb-2 transition-colors">
                        Gaming Setup için En İyi Öneriler
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                          Donanım
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">23 yanıt</span>
                      </div>
                    </div>
                    <div className="text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/forum/topic/2" className="block group">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 border border-purple-100 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 line-clamp-2 text-sm mb-2 transition-colors">
                        2024 Oyun Tavsiyeleri ve İncelemeler
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                          Oyun
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">45 yanıt</span>
                      </div>
                    </div>
                    <div className="text-purple-500 dark:text-purple-400 group-hover:translate-x-1 transition-transform flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/forum/topic/3" className="block group">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 border border-green-100 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/50 dark:hover:to-emerald-900/50 transition-all duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 line-clamp-2 text-sm mb-2 transition-colors">
                        Multiplayer Oyunlarda Takım Çalışması
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                          Strateji
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">12 yanıt</span>
                      </div>
                    </div>
                    <div className="text-green-500 dark:text-green-400 group-hover:translate-x-1 transition-transform flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Forum Konusunu Sil"
        message={`"${topic?.title}" adlı forum konusunu silmek istediğinizden emin misiniz?`}
        isLoading={deleteTopicMutation.isPending}
      />
    </div>
  );
};

export default ForumTopicDetailPage;