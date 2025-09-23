import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  User, 
  Clock, 
  Heart, 
  MessageSquare, 
  Share, 
  Share2,
  Bookmark,
  Eye,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Edit,
  Trash2,
  PenTool,
  Tag,
  Gamepad2,
  FileText,
  Hash
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { BlogPost, Comment, CommentableType, LikableType, ReportableType, FavoriteType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import CommentSection from '../components/comments/CommentSection';
import LikeButton from '../components/common/LikeButton';
import FavoriteButton from '../components/common/FavoriteButton';
import ReportButton from '../components/common/ReportButton';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

const BlogDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const convertToEmbedUrl = (url: string) => {
    // YouTube URL'lerini embed formatına dönüştür
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Vimeo URL'lerini embed formatına dönüştür
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    // Zaten embed formatındaysa veya başka bir URL ise olduğu gibi döndür
    return url;
  };

  // Fetch blog post
  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', id || slug],
    queryFn: () => {
      if (slug) {
        return api.blogs.getBySlug(slug);
      } else if (id) {
        return api.blogs.getById(parseInt(id));
      }
      throw new Error('No id or slug provided');
    },
    enabled: !!(id || slug)
  });

  // Delete blog mutation
  const deleteBlogMutation = useMutation({
    mutationFn: () => api.blogs.delete(blog?.id || parseInt(id!)),
    onSuccess: () => {
      toast.success('Blog yazısı başarıyla silindi!');
      navigate('/blogs');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Blog yazısı silinirken bir hata oluştu');
    }
  });








  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        text: blog?.excerpt,
        url: window.location.href
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
    deleteBlogMutation.mutate();
    setShowDeleteModal(false);
  };

  const renderBlogContent = (content: string) => {
    if (!content) return <p>İçerik yükleniyor...</p>;
    
    const parts = content.split(/(\[image\].*?\[\/image\]|\[quote\].*?\[\/quote\]|\[code(?:=.*?)?\].*?\[\/code\]|\[video\].*?\[\/video\])/g);
    
    return parts.map((part, index) => {
      // Image block
      if (part.match(/\[image\](.*?)\[\/image\]/)) {
        const imageUrl = part.replace(/\[image\](.*?)\[\/image\]/, '$1');
        return (
          <div key={index} className="my-6">
            <img 
              src={imageUrl} 
              alt="Blog content" 
              className="max-w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        );
      }
      
      // Quote block
      if (part.match(/\[quote\](.*?)\[\/quote\]/)) {
        const quoteText = part.replace(/\[quote\](.*?)\[\/quote\]/, '$1');
        return (
          <blockquote key={index} className="border-l-4 border-primary-500 pl-6 py-4 my-6 italic text-gray-600 dark:text-gray-300 bg-primary-50 dark:bg-primary-900/20 rounded-r-lg">
            {quoteText}
          </blockquote>
        );
      }
      
      // Code block
      if (part.match(/\[code(?:=(.*?))?\](.*?)\[\/code\]/)) {
        const matches = part.match(/\[code(?:=(.*?))?\](.*?)\[\/code\]/);
        const language = matches?.[1] || '';
        const codeText = matches?.[2] || '';
        return (
          <div key={index} className="my-6">
            {language && (
              <div className="bg-gray-700 text-gray-300 px-4 py-2 text-sm font-medium rounded-t-lg">
                {language}
              </div>
            )}
            <pre className={`bg-gray-900 text-green-400 p-4 overflow-x-auto ${language ? 'rounded-b-lg' : 'rounded-lg'}`}>
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      
      // Video block
      if (part.match(/\[video\](.*?)\[\/video\]/)) {
        const videoUrl = part.replace(/\[video\](.*?)\[\/video\]/, '$1');
        const embedUrl = convertToEmbedUrl(videoUrl.trim());
        return (
          <div key={index} className="my-6">
            <div className="relative pb-[56.25%] h-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
                title={`Video ${index}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        );
      }
      
      // Regular text
      if (part.trim()) {
        return (
          <div key={index} className="my-4">
            {part.split('\n').map((line, lineIndex) => (
              <p key={lineIndex} className="mb-4 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Blog yazısı yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Blog yazısı bulunamadı
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aradığınız blog yazısı mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link to="/blogs" className="btn-primary mt-4 inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Blog'a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          to="/blogs"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Blog'a Dön
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Blog Header */}
            <div className="card p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-break">
                    {blog.title}
                  </h1>

                  {blog.summary && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Özet</h2>
                      <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed text-break bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
                        {blog.summary}
                      </p>
                    </div>
                  )}

                  {blog.excerpt && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-break">
                      {blog.excerpt}
                    </p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Link 
                      to={`/profile/${blog.author?.username}`}
                      className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>{blog.author?.username}</span>
                    </Link>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{blog.viewCount || 0} görüntüleme</span>
                    </div>
                  </div>

                </div>

                {/* Action buttons */}
                {isAuthenticated && (user?.id === blog.author?.id || user?.id === blog.authorId || user?.id === blog.userId) && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/blogs/edit/${blog.id}`}
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
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center space-x-3">
                  {/* Like/Dislike */}
                  <LikeButton
                    entityType={LikableType.BlogPost}
                    entityId={blog.id}
                    variant="default"
                    size="md"
                    showCounts={true}
                    className="[&_button]:px-3 [&_button]:py-2 [&_button]:font-medium"
                  />
                  
                  {/* Favorite */}
                  <FavoriteButton
                    entityType={FavoriteType.BlogPost}
                    entityId={blog.id}
                    variant="heart"
                    size="sm"
                    showText={true}
                    className="px-4 py-2 rounded-lg font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all duration-200"
                  />
                  
                  {/* Report */}
                  <ReportButton
                    entityType={ReportableType.BlogPost}
                    entityId={blog.id}
                    entityTitle={blog.title}
                    variant="button"
                    className="px-4 py-2 rounded-lg font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-200"
                  />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Son güncelleme: {blog.updatedAt ? formatDate(blog.updatedAt) : formatDate(blog.createdAt)}
                </div>
              </div>
            </div>

            {/* Blog Content */}
            <div className="card p-8 mb-6">
              <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed break-words text-break">
                  {renderBlogContent(blog.content)}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <CommentSection 
              entityType={CommentableType.BlogPost}
              entityId={blog.id}
              entityTitle={blog.title}
              postAuthorId={blog.authorId || blog.author?.id}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Author Info */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Yazar
              </h3>
              <Link 
                to={`/profile/${blog.author?.username}`}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 overflow-hidden">
                  {blog.author?.avatarUrl ? (
                    <img 
                      src={blog.author.avatarUrl} 
                      alt={blog.author.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-lg font-bold">${blog.author?.username?.charAt(0).toUpperCase()}</span>`;
                      }}
                    />
                  ) : (
                    <span>{blog.author?.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{blog.author?.username}</h4>
                </div>
              </Link>
            </div>

            {/* Category */}
            {blog.category && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Kategori
                </h3>
                <Link 
                  to={`/blogs?categoryId=${blog.category.id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer hover:scale-105 transform duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {blog.category.name}
                    </h4>
                    {blog.category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {blog.category.description}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Related Game */}
            {blog.game && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  İlgili Oyun
                </h3>
                <Link 
                  to={blog.game.slug ? `/games/${blog.game.slug}` : `/games/${blog.game.id}`}
                  className="block group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors"
                  title={blog.game.slug ? `/games/${blog.game.slug}` : `/games/${blog.game.id}`}
                >
                  <div className="flex items-center space-x-3">
                    {blog.game.coverImageUrl ? (
                      <img
                        src={blog.game.coverImageUrl}
                        alt={blog.game.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {blog.game.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {blog.game.releaseDate && new Date(blog.game.releaseDate).getFullYear()}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Etiketler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Posts */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <PenTool className="w-5 h-5 mr-2" />
                Benzer Yazılar
              </h3>
              <div className="space-y-3">
                <Link to="/blogs/1" className="block group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2 text-sm mb-2">
                    En İyi RPG Oyunları 2024 Listesi
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full">İnceleme</span>
                    <span>•</span>
                    <span>1.2k görüntülenme</span>
                  </div>
                </Link>
                
                <Link to="/blogs/2" className="block group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2 text-sm mb-2">
                    Gaming Setup Rehberi: Profesyonel Kurulum
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full">Rehber</span>
                    <span>•</span>
                    <span>856 görüntülenme</span>
                  </div>
                </Link>
                
                <Link to="/blogs/3" className="block group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2 text-sm mb-2">
                    Indie Oyun Önerileri ve Gizli İnciler
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full">Öneri</span>
                    <span>•</span>
                    <span>643 görüntülenme</span>
                  </div>
                </Link>
              </div>
              
              <Link to="/blogs" className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-4 font-medium">
                Tüm Yazılar →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Blog Yazısını Sil"
        message={`"${blog?.title}" adlı blog yazısını silmek istediğinizden emin misiniz?`}
        isLoading={deleteBlogMutation.isPending}
      />
    </div>
  );
};

export default BlogDetailPage;
