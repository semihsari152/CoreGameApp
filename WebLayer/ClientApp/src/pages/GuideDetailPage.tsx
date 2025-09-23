import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Eye, 
  Star, 
  Calendar, 
  User, 
  Heart, 
  Share2, 
  Edit3,
  Edit,
  Trash2,
  MessageCircle,
  Tag,
  BookOpen,
  Hash,
  ChevronRight,
  FolderOpen,
  Bookmark,
  Quote,
  Flag,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import CommentSection from '../components/comments/CommentSection';
import { CommentableType, LikableType, ReportableType, FavoriteType } from '../types';
import { apiService as api } from '../services/api';
import LikeButton from '../components/common/LikeButton';
import FavoriteButton from '../components/common/FavoriteButton';
import ReportButton from '../components/common/ReportButton';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

interface GuideDetailResponse {
  id: number;
  title: string;
  summary?: string;
  difficulty: string;
  viewCount?: number;
  averageRating?: number;
  ratingCount?: number;
  createdDate?: string;
  updatedDate?: string;
  tags?: string[];
  guideBlocks?: {
    id: number;
    blockType: number;
    order: number;
    title?: string;
    content?: string;
    mediaUrl?: string;
    caption?: string;
    metadata?: string;
  }[];
  author?: {
    id: number;
    username: string;
    avatarUrl?: string;
    isActive?: boolean;
  };
  game?: {
    id: number;
    name: string;
    coverImageUrl?: string;
  } | null;
  guideCategory?: {
    id: number;
    name: string;
    iconClass?: string;
  };
}

const GuideDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Fetch guide details
  const { data: guide, isLoading, error } = useQuery({
    queryKey: ['guide', id || slug],
    queryFn: () => {
      if (slug) {
        return api.guides.getBySlug(slug);
      } else if (id) {
        return api.guides.getById(parseInt(id));
      }
      throw new Error('No id or slug provided');
    },
    enabled: !!(id || slug)
  });

  // Delete guide mutation
  const deleteGuideMutation = useMutation({
    mutationFn: () => api.guides.delete(guide?.id || parseInt(id!)),
    onSuccess: () => {
      toast.success('Rehber başarıyla silindi!');
      navigate('/guides');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Rehber silinirken bir hata oluştu');
    }
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: guide?.title || 'Oyun Rehberi',
        text: guide?.summary || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteGuideMutation.mutate();
    setShowDeleteModal(false);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)} gün önce`;
    if (diffInHours < 24 * 30) return `${Math.floor(diffInHours / (24 * 7))} hafta önce`;
    return `${Math.floor(diffInHours / (24 * 30))} ay önce`;
  };

  const getDifficultyStars = (difficulty: string) => {
    const difficultyMap: { [key: string]: string } = {
      'Çok Kolay': '⭐',
      'Kolay': '⭐⭐',
      'Orta': '⭐⭐⭐',
      'Zor': '⭐⭐⭐⭐',
      'Çok Zor': '⭐⭐⭐⭐⭐'
    };
    return difficultyMap[difficulty] || '❓';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar skeleton */}
            <div className="lg:col-span-1">
              <div className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-dark-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="lg:col-span-3">
              <div className="card p-8 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3 mb-8"></div>
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-dark-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Rehber Bulunamadı
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {typeof error === 'string' ? error : (error as any)?.message || 'Rehber yüklenirken bir hata oluştu'}
          </p>
          <Link
            to="/guides"
            className="btn-primary inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Rehberlere Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!guide) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-primary-200 text-sm mb-6">
            <Link to="/guides" className="hover:text-white transition-colors">
              Rehberler
            </Link>
            <ChevronRight className="w-4 h-4" />
            {guide.game && (
              <>
                <Link to={guide.game.slug ? `/games/${guide.game.slug}` : `/games/${guide.game.id}`} className="hover:text-white transition-colors">
                  {guide.game.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-white">{guide.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-gaming font-bold flex-1 text-break">
                  {guide.title}
                </h1>
                
                {/* Edit/Delete Buttons - Only for guide author */}
                {isAuthenticated && (user?.id === guide.author?.id || user?.id === (guide as any).userId) && (
                  <div className="flex items-center space-x-3 ml-6">
                    <Link
                      to={`/guides/edit/${guide.id}`}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="font-medium">Düzenle</span>
                    </Link>
                    <button
                      onClick={handleDeleteClick}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="font-medium">Sil</span>
                    </button>
                  </div>
                )}
              </div>
              
              {guide.summary && (
                <p className="text-xl text-primary-100 mb-6 leading-relaxed text-break">
                  {guide.summary}
                </p>
              )}

              <div className="space-y-4 mb-6">
                {/* Stats */}
                <div className="flex items-center gap-6 text-primary-100">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">{guide.viewCount?.toLocaleString() || 0}</span>
                    <span className="text-xs text-primary-200">görüntüleme</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">{guide.createdDate ? formatTimeAgo(guide.createdDate) : 'Bilinmiyor'}</span>
                  </span>
                </div>
              </div>

              {/* Tags */}
              {(guide as any).tags && (guide as any).tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(guide as any).tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author & Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                {/* Author */}
                {(guide.author || guide.user) && (
                  <Link
                    to={`/profile/${guide.author?.username || guide.user?.username}`}
                    className="flex items-center gap-3 mb-6 hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      {(guide.author?.avatarUrl || guide.user?.avatarUrl) ? (
                        <img
                          src={guide.author?.avatarUrl || guide.user?.avatarUrl}
                          alt={guide.author?.username || guide.user?.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-primary-200 transition-colors">
                        {guide.author?.username || guide.user?.username}
                      </div>
                    </div>
                  </Link>
                )}


                {/* Actions */}
                <div className="space-y-4">
                  {/* Like/Dislike */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-center">
                      <LikeButton
                        entityType={LikableType.Guide}
                        entityId={guide.id}
                        variant="default"
                        size="lg"
                        showCounts={true}
                        className="[&_button]:bg-transparent [&_button]:text-white [&_button:hover]:bg-white/20 [&_button]:border-0 [&_button]:px-6 [&_button]:py-3 [&_button]:text-base [&_button]:font-semibold [&_button]:rounded-lg [&>div]:gap-4 [&_button]:text-center [&_button]:justify-center [&_span]:text-white"
                      />
                    </div>
                  </div>

                  {/* Favorite */}
                  <FavoriteButton
                    entityType={FavoriteType.Guide}
                    entityId={guide.id}
                    variant="heart"
                    size="lg"
                    showText={true}
                    className="w-full px-6 py-3 text-base font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 border-0 text-center justify-center [&_span]:text-white [&_svg]:text-white"
                  />

                  {/* Report */}
                  <ReportButton
                    entityType={ReportableType.Guide}
                    entityId={guide.id}
                    entityTitle={guide.title}
                    variant="button"
                    className="w-full px-6 py-3 text-base font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 text-center justify-center [&_span]:text-white [&_svg]:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Guide Category */}
              {guide.guideCategory && (
                <Link 
                  to={`/guides?categoryId=${guide.guideCategory.id}`}
                  className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 p-[2px] hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                  <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 h-full hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Kategori
                        </div>
                        <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                          {guide.guideCategory.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category Description Box */}
                    <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/30 dark:to-cyan-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        {guide.guideCategory.name === 'Başlangıç' && 'Yeni oyunculara yönelik temel bilgiler ve ipuçları'}
                        {guide.guideCategory.name === 'İleri Seviye' && 'Deneyimli oyuncular için gelişmiş stratejiler'}
                        {guide.guideCategory.name === 'Strateji' && 'Oyun stratejileri ve taktiksel yaklaşımlar'}
                        {guide.guideCategory.name === 'İpuçları' && 'Faydalı ipuçları ve kısa yollar'}
                        {guide.guideCategory.name === 'Karakter Rehberi' && 'Karakter seçimi ve gelişimi rehberi'}
                        {(!['Başlangıç', 'İleri Seviye', 'Strateji', 'İpuçları', 'Karakter Rehberi'].includes(guide.guideCategory.name)) && 
                         'Bu kategori hakkında detaylı bilgiler ve rehberler'}
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Difficulty */}
              {guide.difficulty && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-800 to-cyan-700 p-[2px]">
                  <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Zorluk Seviyesi
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {guide.difficulty}
                        </div>
                      </div>
                    </div>
                    
                    {/* Difficulty Progress Bar */}
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Basit</span>
                        <span>Çok Zor</span>
                      </div>
                      
                      <div className="relative pb-2">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              guide.difficulty === 'Çok Kolay' ? 'w-[18%] bg-gradient-to-r from-green-400 to-green-500' :
                              guide.difficulty === 'Kolay' ? 'w-[38%] bg-gradient-to-r from-green-400 to-yellow-400' :
                              guide.difficulty === 'Orta' ? 'w-[58%] bg-gradient-to-r from-yellow-400 to-orange-400' :
                              guide.difficulty === 'Zor' ? 'w-[78%] bg-gradient-to-r from-orange-400 to-red-500' :
                              guide.difficulty === 'Çok Zor' ? 'w-[98%] bg-gradient-to-r from-red-500 to-red-600' :
                              'w-[50%] bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                          ></div>
                        </div>
                        
                        {/* Difficulty indicators */}
                        <div className="absolute -top-1 left-0 w-full flex justify-between px-1">
                          {['Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'].map((level, index) => (
                            <div 
                              key={level}
                              className={`w-4 h-4 rounded-full border-2 ${
                                guide.difficulty === level 
                                  ? 'bg-white border-gray-900 shadow-lg scale-125' 
                                  : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500'
                              } transition-all duration-300`}
                            ></div>
                          ))}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              )}

              {/* Game Info */}
              {guide.game && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    İlgili Oyun
                  </h3>
                  <Link 
                    to={guide.game.slug ? `/games/${guide.game.slug}` : `/games/${guide.game.id}`}
                    className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title={guide.game.slug ? `/games/${guide.game.slug}` : `/games/${guide.game.id}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
                          {guide.game.coverImageUrl ? (
                            <img
                              src={guide.game.coverImageUrl}
                              alt={guide.game.name}
                              className="w-full h-full object-cover"
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                          {guide.game.name}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                          Detayları Gör →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Similar Guides */}
              <SimilarGuidesCard guideId={guide.id} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card p-8 mb-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {guide.guideBlocks && guide.guideBlocks.length > 0 ? (
                  <div className="space-y-8">
                    {guide.guideBlocks
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((block: any, index: number) => {
                        console.log('Rendering block:', block);
                        return (
                      <div key={block.id} className="relative">
                        {/* Text Block */}
                        {block.blockType === 1 && block.content && (
                          <div className="prose prose-gray dark:prose-invert max-w-none">
                            {block.title && (
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-break">
                                {block.title}
                              </h3>
                            )}
                            {block.content.split('\n').map((line: string, i: number) => (
                              <p key={i} className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3 text-break">
                                {line || <br />}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Image Block */}
                        {block.blockType === 2 && block.mediaUrl && (
                          <div className="text-center my-8">
                            <img 
                              src={block.mediaUrl} 
                              alt={block.caption || block.title || 'Guide image'}
                              className="rounded-xl w-full max-w-4xl h-auto shadow-xl mx-auto"
                              loading="lazy"
                            />
                            {block.caption && (
                              <p className="text-base text-gray-600 dark:text-gray-400 mt-4 italic">
                                {block.caption}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Video Block */}
                        {block.blockType === 3 && block.mediaUrl && (
                          <div className="my-6">
                            {(() => {
                              const getYouTubeId = (url: string) => {
                                const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
                                const match = url.match(regex);
                                return match ? match[1] : null;
                              };
                              const youtubeId = getYouTubeId(block.mediaUrl);
                              
                              if (youtubeId) {
                                return (
                                  <div className="aspect-video">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${youtubeId}`}
                                      title={block.caption || 'Video'}
                                      className="w-full h-full rounded-xl"
                                      allowFullScreen
                                    />
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                    <p className="text-gray-500 dark:text-gray-400">Video yüklenemedi</p>
                                  </div>
                                );
                              }
                            })()}
                            {block.caption && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic text-center">
                                {block.caption}
                              </p>
                            )}
                          </div>
                        )}

                        {/* List Block */}
                        {block.blockType === 5 && block.content && (
                          <div className="my-6">
                            {block.title && (
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-break">
                                {block.title}
                              </h3>
                            )}
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                              {block.content.split('\n').map((item: string, i: number) => 
                                item.trim() && (
                                  <li key={i} className="leading-relaxed">
                                    {item.replace(/^[\d\.\-\*\+]\s*/, '')}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Quote Block */}
                        {block.blockType === 6 && block.content && (
                          <div className="my-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg">
                            <div className="flex items-start space-x-3">
                              <Quote className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                              <div>
                                {block.title && (
                                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    {block.title}
                                  </h4>
                                )}
                                <p className="text-blue-800 dark:text-blue-200 italic">
                                  {block.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Divider Block */}
                        {block.blockType === 7 && (
                          <div className="flex items-center justify-center my-8">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                          </div>
                        )}
                      </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Bu rehber için henüz içerik eklenmemiş.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <CommentSection 
              entityType={CommentableType.Guide}
              entityId={guide.id}
              entityTitle={guide.title}
              postAuthorId={guide.userId || guide.author?.id || guide.user?.id}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Rehberi Sil"
        message={`"${guide?.title}" adlı rehberi silmek istediğinizden emin misiniz?`}
        isLoading={deleteGuideMutation.isPending}
      />
    </div>
  );
};

// Similar Guides Card Component
const SimilarGuidesCard: React.FC<{ guideId: number }> = ({ guideId }) => {
  const { data: similarGuides, isLoading } = useQuery({
    queryKey: ['similarGuides', guideId],
    queryFn: () => api.guides.getSimilar(guideId, 4),
    enabled: !!guideId
  });

  if (isLoading) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Benzer Rehberler
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!similarGuides || similarGuides.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Benzer Rehberler
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Henüz benzer rehber bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        Benzer Rehberler
      </h3>
      <div className="space-y-4">
        {similarGuides.map((guide: any) => (
          <Link
            key={guide.id}
            to={guide.slug ? `/guide/${guide.slug}` : `/guides/${guide.id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600">
              {/* Main Content */}
              <div className="p-4 pb-0">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {guide.title}
                    </h4>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <Link 
                        to={`/profile/${guide.user?.username}`}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-2.5 h-2.5" />
                        </div>
                        {guide.user?.username}
                      </Link>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {guide.viewCount?.toLocaleString() || 0}
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Category Badge - Full Width Bottom */}
              {guide.guideCategory && (
                <div className="px-4 py-3">
                  <div className="flex justify-center">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      <Tag className="w-3 h-3 mr-1.5" />
                      {guide.guideCategory.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GuideDetailPage;