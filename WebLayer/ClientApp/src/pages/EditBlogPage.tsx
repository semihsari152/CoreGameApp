import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save,
  Eye,
  Tag, 
  Clock, 
  AlertCircle, 
  Plus,
  X,
  Image as ImageIcon,
  Type,
  Bold,
  Italic,
  Link as LinkIcon,
  Gamepad2,
  Calendar,
  User,
  FileText,
  Hash,
  Globe,
  Camera,
  Quote,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService as api } from '../services/api';
import { Game, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'quote' | 'video';
  content: string;
  metadata?: string;
  order: number;
}

interface UpdateBlogPostDto {
  title: string;
  summary: string;
  content: string;
  gameId?: number;
  coverImageUrl?: string;
  tags: string[];
  categoryId: number;
  isPublished: boolean;
}

interface BlogCategory {
  id: number;
  name: string;
  description?: string;
}

const EditBlogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [gameId, setGameId] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'text', content: '', order: 0 }
  ]);
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch blog data
  const { data: blog, isLoading: blogLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => api.blogs.getById(parseInt(id!)),
    enabled: !!id
  });

  // Load games and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load games
        const gamesResponse = await api.games.getPopular(200);
        setGames(gamesResponse || []);

        // Load blog categories from database
        const blogCategories = await api.blogs.getCategories();
        setCategories(blogCategories);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // Load blog data into form (only once when blog is first loaded)
  useEffect(() => {
    if (blog && !isInitialized) {
      // Set form values
      setTitle(blog.title || '');
      setSummary(blog.summary || blog.excerpt || '');
      setCategoryId(blog.categoryId || blog.category?.id || 0);
      setGameId(blog.gameId || blog.game?.id || undefined);
      setCoverImageUrl(blog.coverImageUrl || blog.thumbnailUrl || '');
      
      // Load existing tags
      if (blog.tags && Array.isArray(blog.tags)) {
        setTags(blog.tags);
      } else if (typeof blog.tags === 'string') {
        const tagArray = (blog.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        setTags(tagArray);
      } else {
        setTags([]);
      }
      
      // Convert content to blocks (parse text, images, quotes, videos)
      if (blog.content) {
        const blocks = parseContentToBlocks(blog.content);
        setContentBlocks(blocks.length > 0 ? blocks : [{ id: '1', type: 'text', content: '', order: 0 }]);
      }
      
      setIsInitialized(true);
    }
  }, [blog, isInitialized]);

  // Auth check
  useEffect(() => {
    if (blog && user) {
      const isAuthor = blog.authorId === user?.id || blog.author?.id === user?.id || blog.userId === user?.id;
      const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Moderator;
      
      if (!isAuthor && !isAdmin) {
        toast.error('Bu blog yazısını düzenleme yetkiniz yok');
        navigate(`/blogs/${id}`);
      }
    }
  }, [blog, user, id, navigate]);

  // Parse content string to separate text, image, quote, and video blocks
  const parseContentToBlocks = (content: string): ContentBlock[] => {
    const blocks: ContentBlock[] = [];
    let blockId = 1;
    
    // Split content by various block tags
    const parts = content.split(/(\[(?:image|quote|video)\].*?\[\/(?:image|quote|video)\])/g);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // Check for different block types
      const imageMatch = part.match(/\[image\](.*?)\[\/image\]/);
      const quoteMatch = part.match(/\[quote\](.*?)\[\/quote\]/);
      const videoMatch = part.match(/\[video\](.*?)\[\/video\]/);
      
      if (imageMatch) {
        blocks.push({
          id: blockId.toString(),
          type: 'image',
          content: imageMatch[1],
          order: blocks.length
        });
        blockId++;
      } else if (quoteMatch) {
        blocks.push({
          id: blockId.toString(),
          type: 'quote',
          content: quoteMatch[1],
          order: blocks.length
        });
        blockId++;
      } else if (videoMatch) {
        blocks.push({
          id: blockId.toString(),
          type: 'video',
          content: videoMatch[1],
          order: blocks.length
        });
        blockId++;
      } else {
        // This is a text block
        blocks.push({
          id: blockId.toString(),
          type: 'text',
          content: part,
          order: blocks.length
        });
        blockId++;
      }
    }
    
    return blocks;
  };

  const addContentBlock = (type: 'text' | 'image' | 'quote' | 'video') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      order: contentBlocks.length
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateContentBlock = (id: string, content: string, metadata?: string) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === id ? { ...block, content, metadata } : block
      )
    );
  };

  const removeContentBlock = (id: string) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(blocks => blocks.filter(block => block.id !== id));
    }
  };

  const moveBlockUp = (id: string) => {
    const blockIndex = contentBlocks.findIndex(block => block.id === id);
    if (blockIndex > 0) {
      const newBlocks = [...contentBlocks];
      [newBlocks[blockIndex], newBlocks[blockIndex - 1]] = [newBlocks[blockIndex - 1], newBlocks[blockIndex]];
      setContentBlocks(newBlocks);
    }
  };

  const moveBlockDown = (id: string) => {
    const blockIndex = contentBlocks.findIndex(block => block.id === id);
    if (blockIndex < contentBlocks.length - 1) {
      const newBlocks = [...contentBlocks];
      [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
      setContentBlocks(newBlocks);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Başlık gereklidir';
    }

    if (!summary.trim()) {
      newErrors.summary = 'Özet gereklidir';
    }

    if (summary.length < 50) {
      newErrors.summary = 'Özet en az 50 karakter olmalıdır';
    }

    if (categoryId === 0) {
      newErrors.category = 'Kategori seçimi gereklidir';
    }

    if (contentBlocks.every(block => !block.content.trim())) {
      newErrors.content = 'İçerik gereklidir';
    }

    if (tags.length === 0) {
      newErrors.tags = 'En az bir etiket eklemelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update blog mutation
  const updateBlogMutation = useMutation({
    mutationFn: (data: UpdateBlogPostDto) => api.blogs.update(parseInt(id!), data),
    onSuccess: () => {
      toast.success('Blog yazısı başarıyla güncellendi!');
      navigate(`/blogs/${id}`);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Blog yazısı güncellenirken hata oluştu');
    }
  });

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const content = contentBlocks
        .map(block => {
          switch (block.type) {
            case 'text':
              return block.content;
            case 'image':
              return `[image]${block.content}[/image]`;
            case 'quote':
              return `[quote]${block.content}[/quote]`;
            case 'video':
              return `[video]${block.content}[/video]`;
            default:
              return block.content;
          }
        })
        .join('\n\n');

      const blogData: UpdateBlogPostDto = {
        title: title.trim(),
        summary: summary.trim(),
        content,
        categoryId,
        gameId,
        coverImageUrl: coverImageUrl.trim() || undefined,
        tags,
        isPublished: true
      };

      updateBlogMutation.mutate(blogData);
    } catch (error: any) {
      console.error('Blog update error:', error);
      toast.error(error.response?.data?.message || 'Blog yazısı güncellenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    const commonClasses = "w-full p-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors";

    return (
      <div key={block.id} className="space-y-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Block {index + 1} - {block.type.toUpperCase()}
            </span>
            <div className="flex gap-1">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveBlockUp(block.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ↑
                </button>
              )}
              {index < contentBlocks.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveBlockDown(block.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ↓
                </button>
              )}
            </div>
          </div>
          {contentBlocks.length > 1 && (
            <button
              type="button"
              onClick={() => removeContentBlock(block.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {block.type === 'text' && (
          <textarea
            value={block.content}
            onChange={(e) => updateContentBlock(block.id, e.target.value)}
            placeholder="Metin içeriğinizi yazın..."
            rows={6}
            className={commonClasses}
          />
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            <input
              type="url"
              value={block.content}
              onChange={(e) => updateContentBlock(block.id, e.target.value)}
              placeholder="Görsel URL'si girin..."
              className={commonClasses}
            />
            {block.content && (
              <img
                src={block.content}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {block.type === 'quote' && (
          <textarea
            value={block.content}
            onChange={(e) => updateContentBlock(block.id, e.target.value)}
            placeholder="Alıntı metnini yazın..."
            rows={3}
            className={`${commonClasses} border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20`}
          />
        )}

        {block.type === 'video' && (
          <div className="space-y-2">
            <input
              type="url"
              value={block.content}
              onChange={(e) => updateContentBlock(block.id, e.target.value)}
              placeholder="Video URL'si (YouTube, Vimeo vb.)..."
              className={commonClasses}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              YouTube, Vimeo veya doğrudan video dosyası URL'si ekleyebilirsiniz.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (blogLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Blog yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Blog Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-400">Düzenlemek istediğiniz blog mevcut değil.</p>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Düzenlemeye Dön
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Önizleme</h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{summary}</p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="prose dark:prose-invert max-w-none">
              {contentBlocks.map((block, index) => (
                <div key={block.id} className="mb-4">
                  {block.type === 'text' && <p className="whitespace-pre-wrap">{block.content}</p>}
                  {block.type === 'image' && block.content && (
                    <img src={block.content} alt={`Content ${index + 1}`} className="rounded-lg" />
                  )}
                  {block.type === 'quote' && (
                    <blockquote className="border-l-4 border-primary-500 pl-4 italic">
                      {block.content}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-8">
            <Link
              to={`/blogs/${id}`}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Blog'a Dön
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Blog Yazısını Düzenle</h1>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setIsPreview(true)}
              disabled={!title || !summary}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Eye className="w-5 h-5" />
              Önizleme
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || updateBlogMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save className="w-5 h-5" />
              {isLoading || updateBlogMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Temel Bilgiler</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Başlık *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Blog yazınızın çarpıcı başlığını girin..."
                    maxLength={200}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Type className="w-4 h-4 inline mr-1" />
                    Özet *
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    className="w-full p-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Blog yazınızın okuyucuları cezbedecek kısa bir özetini yazın (en az 50 karakter)..."
                    maxLength={500}
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-red-500">{errors.summary || ''}</span>
                    <span className="text-gray-500">{summary.length}/500</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Kapak Görseli
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full p-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Kapak görseli URL'si girin (opsiyonel)..."
                  />
                  {coverImageUrl && (
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="mt-2 max-w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">İçerik Blokları</h2>
              
              <div className="space-y-4">
                {contentBlocks.map((block, index) => renderContentBlock(block, index))}
              </div>
              
              {errors.content && <p className="text-red-500 text-sm mt-2">{errors.content}</p>}
              
              {/* Add Content Block Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addContentBlock('text')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <Type className="w-4 h-4" />
                  Metin
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock('image')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Görsel
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock('quote')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                >
                  <Quote className="w-4 h-4" />
                  Alıntı
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock('video')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Video
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <FileText className="w-5 h-5 inline mr-2" />
                Kategori *
              </h3>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(parseInt(e.target.value))}
                className="w-full p-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value={0}>Kategori seçin</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-2">{errors.category}</p>}
              {categoryId > 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {categories.find(c => c.id === categoryId)?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Game Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Gamepad2 className="w-5 h-5 inline mr-2" />
                Oyun (Opsiyonel)
              </h3>
              <select
                value={gameId || ''}
                onChange={(e) => setGameId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full p-4 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="">Oyun seçmeyin</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Tag className="w-5 h-5 inline mr-2" />
                Etiketler *
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 p-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="Etiket ekle..."
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 10}
                  className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {tags.length}/10 etiket
              </p>
              {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBlogPage;