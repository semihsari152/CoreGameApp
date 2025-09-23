import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Users, 
  Tag, 
  Clock, 
  AlertCircle, 
  Save,
  X,
  Image as ImageIcon,
  Type,
  Bold,
  Italic,
  Link as LinkIcon,
  Gamepad2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService as api } from '../services/api';
import { ForumCategory, Game } from '../types';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
  order: number;
}

const EditForumTopicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [gameId, setGameId] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'text', content: '', order: 0 }
  ]);
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch topic data
  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: ['forum-topic', id],
    queryFn: () => api.forum.getTopicById(parseInt(id!)),
    enabled: !!id
  });

  // Load categories and games
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const categoriesResponse = await api.forum.getCategories();
        const fetchedCategories = categoriesResponse.data || categoriesResponse;
        setCategories(fetchedCategories);

        // Load popular games for selection
        const gamesResponse = await api.games.getPopular(100);
        setGames(gamesResponse || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback categories
        const mockCategories: ForumCategory[] = [
          { id: 1, name: 'Genel Tartışma' },
          { id: 2, name: 'Yardım & Destek' },
          { id: 3, name: 'Oyun İncelemeleri' },
          { id: 4, name: 'Haberler' },
          { id: 5, name: 'Rehberler & İpuçları' },
          { id: 6, name: 'Diğer' }
        ];
        setCategories(mockCategories);
      }
    };
    
    loadData();
  }, []);

  // Load topic data into form (only once when topic is first loaded)
  useEffect(() => {
    if (topic && !isInitialized) {     
      // Set form values
      setTitle(topic.title || '');
      
      // API returns different field names - use direct fields from backend
      const categoryIdValue = topic.forumCategoryId || topic.category?.id || 0;
      const gameIdValue = topic.gameId || topic.game?.id || undefined;
      
      setCategoryId(categoryIdValue);
      setGameId(gameIdValue);
      
      // Load existing tags - API returns tags as array of strings  
      if (topic.tags && Array.isArray(topic.tags)) {
        setTags(topic.tags);
      } else if (typeof topic.tags === 'string') {
        // If tags come as comma-separated string
        const tagArray = (topic.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        setTags(tagArray);
      } else {
        setTags([]);
      }
      
      // Convert content to blocks (parse text and images)
      if (topic.content) {
        const blocks = parseContentToBlocks(topic.content);
        setContentBlocks(blocks.length > 0 ? blocks : [{ id: '1', type: 'text', content: '', order: 0 }]);
      }
      
      setIsInitialized(true);
    }
  }, [topic, isInitialized]);

  // Separate effect for auth check
  useEffect(() => {
    if (topic && user) {
      const isAuthor = topic.userId === user?.id || topic.user?.id === user?.id;
      const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Moderator;
      
      if (!isAuthor && !isAdmin) {
        toast.error('Bu konuyu düzenleme yetkiniz yok');
        navigate(`/forum/topic/${id}`);
      }
    }
  }, [topic, user, id, navigate]);

  // Parse content string to separate text and image blocks
  const parseContentToBlocks = (content: string): ContentBlock[] => {
    const blocks: ContentBlock[] = [];
    let blockId = 1;
    
    // Split content by image tags and handle text/image separation
    const parts = content.split(/(\[image\].*?\[\/image\])/g);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // Check if this part is an image tag
      const imageMatch = part.match(/\[image\](.*?)\[\/image\]/);
      if (imageMatch) {
        // This is an image block
        blocks.push({
          id: blockId.toString(),
          type: 'image',
          content: imageMatch[1],
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

  const addContentBlock = (type: 'text' | 'image') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      order: contentBlocks.length
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateContentBlock = (id: string, content: string) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const removeContentBlock = (id: string) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(blocks => blocks.filter(block => block.id !== id));
    }
  };

  const moveBlockUp = (id: string) => {
    setContentBlocks(blocks => {
      const index = blocks.findIndex(block => block.id === id);
      if (index > 0) {
        const newBlocks = [...blocks];
        [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
        return newBlocks.map((block, i) => ({ ...block, order: i }));
      }
      return blocks;
    });
  };

  const moveBlockDown = (id: string) => {
    setContentBlocks(blocks => {
      const index = blocks.findIndex(block => block.id === id);
      if (index < blocks.length - 1) {
        const newBlocks = [...blocks];
        [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
        return newBlocks.map((block, i) => ({ ...block, order: i }));
      }
      return blocks;
    });
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    
    if (trimmedTag.length < 2) {
      toast.error('Etiket en az 2 karakter olmalıdır');
      return;
    }
    
    if (trimmedTag.length > 20) {
      toast.error('Etiket en fazla 20 karakter olabilir');
      return;
    }
    
    if (tags.length >= 10) {
      toast.error('En fazla 10 etiket ekleyebilirsiniz');
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      toast.error('Bu etiket zaten ekli');
      return;
    }
    
    setTags([...tags, trimmedTag]);
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Konu başlığı gereklidir';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Konu başlığı en az 5 karakter olmalıdır';
    }

    if (categoryId === 0) {
      newErrors.categoryId = 'Kategori seçimi gereklidir';
    }

    const hasContent = contentBlocks.some(block => block.content.trim());
    if (!hasContent) {
      newErrors.content = 'En az bir içerik bloğu doldurulmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: (data: any) => api.forum.updateTopic(parseInt(id!), data),
    onSuccess: () => {
      toast.success('Konu başarıyla güncellendi!');
      navigate(`/forum/topic/${id}`);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Konu güncellenirken hata oluştu');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen formu doğru şekilde doldurun');
      return;
    }

    setIsLoading(true);
    try {
      // Combine content blocks into a single content string
      const combinedContent = contentBlocks
        .map(block => {
          if (block.type === 'text') {
            return block.content;
          } else {
            return `[image]${block.content}[/image]`;
          }
        })
        .join('\n\n');

      const topicData = {
        title: title.trim(),
        content: combinedContent,
        categoryId,
        forumCategoryId: categoryId,
        gameId: gameId || undefined,
        tags: tags.length > 0 ? tags : undefined
      };


      updateTopicMutation.mutate(topicData);
    } catch (error: any) {
      console.error('Forum topic update failed:', error);
      toast.error(error.response?.data?.message || 'Konu güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentBlock = (block: ContentBlock) => (
    <div key={block.id} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {block.type === 'text' ? (
            <Type className="w-4 h-4 text-gray-500" />
          ) : (
            <ImageIcon className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {block.type === 'text' ? 'Metin' : 'Görsel'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => moveBlockUp(block.id)}
            className="text-gray-400 hover:text-gray-600"
            disabled={contentBlocks.indexOf(block) === 0}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveBlockDown(block.id)}
            className="text-gray-400 hover:text-gray-600"
            disabled={contentBlocks.indexOf(block) === contentBlocks.length - 1}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => removeContentBlock(block.id)}
            className="text-red-400 hover:text-red-600"
            disabled={contentBlocks.length === 1}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {block.type === 'text' ? (
        <textarea
          value={block.content}
          onChange={(e) => updateContentBlock(block.id, e.target.value)}
          className="input h-32 resize-none"
          placeholder="Metin içeriğinizi buraya yazın..."
        />
      ) : (
        <div>
          <input
            type="url"
            value={block.content}
            onChange={(e) => updateContentBlock(block.id, e.target.value)}
            className="input"
            placeholder="Görsel URL'si girin..."
          />
          {block.content && (
            <div className="mt-2">
              <img
                src={block.content}
                alt="Önizleme"
                className="max-w-full h-auto max-h-48 rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (topicLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Konu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Konu Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-400">Düzenlemek istediğiniz konu mevcut değil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              to={`/forum/topic/${id}`} 
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Konuya Dön
            </Link>
          </div>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Forum Konusunu Düzenle
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Konu Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Konunuzun başlığını yazın..."
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(parseInt(e.target.value))}
                className={`input ${errors.categoryId ? 'border-red-500' : ''}`}
              >
                <option value={0}>Kategori seçin...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
              )}
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İlgili Oyun (İsteğe Bağlı)
              </label>
              <div className="flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5 text-gray-400" />
                <select
                  value={gameId || ''}
                  onChange={(e) => setGameId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="input flex-1"
                >
                  <option value="">Oyun seçin...</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Bu forum konusunu belirli bir oyunla ilişkilendirebilirsiniz
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etiketler (Maksimum 10)
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex-1 flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="input flex-1"
                    placeholder="Etiket yazın ve Enter'a basın (2-20 karakter)..."
                    maxLength={20}
                    minLength={2}
                    disabled={tags.length >= 10}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="btn-secondary"
                  disabled={!newTag.trim() || newTag.trim().length < 2 || tags.length >= 10}
                >
                  Ekle
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {tags.length}/10 etiket kullanıldı
              </p>
            </div>

            {/* Content Blocks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İçerik *
              </label>
              <div className="space-y-4">
                {contentBlocks.map(renderContentBlock)}
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => addContentBlock('text')}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800"
                >
                  <Type className="w-4 h-4" />
                  <span>Metin Ekle</span>
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock('image')}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Görsel Ekle</span>
                </button>
              </div>
              
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-dark-700">
              <button
                type="button"
                onClick={() => navigate(`/forum/topic/${id}`)}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading || updateTopicMutation.isPending}
                className="btn-primary"
              >
                {isLoading || updateTopicMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Güncelleniyor...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Konuyu Güncelle
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditForumTopicPage;