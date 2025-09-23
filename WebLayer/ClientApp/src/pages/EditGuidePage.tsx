import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  Eye, 
  ArrowLeft,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  List,
  Quote,
  Minus,
  Star,
  Video,
  AlertCircle
} from 'lucide-react';
import { CreateGuideBlock, GuideCategory, GuideBlockType } from '../types/guide';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface Game {
  id: number;
  name: string;
  coverImageUrl?: string;
}

interface GuideFormData {
  title: string;
  summary: string;
  gameId: number;
  difficulty: string;
  guideCategoryId: number | undefined;
  thumbnailUrl: string;
  isPublished: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'Çok Kolay', label: 'Çok Kolay', icon: '⭐', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'Kolay', label: 'Kolay', icon: '⭐⭐', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'Orta', label: 'Orta', icon: '⭐⭐⭐', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'Zor', label: 'Zor', icon: '⭐⭐⭐⭐', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'Çok Zor', label: 'Çok Zor', icon: '⭐⭐⭐⭐⭐', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const BLOCK_TYPES = [
  { type: GuideBlockType.Text, name: 'Metin', icon: Type, description: 'Düz metin paragrafı', category: 'basic' },
  { type: GuideBlockType.Image, name: 'Resim', icon: ImageIcon, description: 'Resim ekle', category: 'media' },
  { type: GuideBlockType.Video, name: 'Video', icon: Video, description: 'YouTube video ekle', category: 'media' },
  { type: GuideBlockType.List, name: 'Liste', icon: List, description: 'Madde işaretli liste', category: 'basic' },
  { type: GuideBlockType.Quote, name: 'Alıntı', icon: Quote, description: 'Önemli not veya alıntı', category: 'basic' },
  { type: GuideBlockType.Divider, name: 'Ayırıcı', icon: Minus, description: 'Bölüm ayırıcı çizgi', category: 'basic' },
] as const;

const EditGuidePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [blocks, setBlocks] = useState<CreateGuideBlock[]>([
    { blockType: GuideBlockType.Text, order: 1, content: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<GuideFormData>({
    defaultValues: {
      title: '',
      summary: '',
      gameId: 0,
      difficulty: 'Orta',
      guideCategoryId: undefined,
      thumbnailUrl: '',
      isPublished: true
    }
  });

  const watchedValues = watch();

  // Fetch guide data
  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', id],
    queryFn: () => apiService.guides.getById(parseInt(id!)),
    enabled: !!id
  });

  // Load games and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load games
        const gamesResponse = await fetch('/api/games?pageSize=100');
        const gamesResult = await gamesResponse.json();
        if (gamesResult.data && Array.isArray(gamesResult.data)) {
          setGames(gamesResult.data.map((game: any) => ({
            id: game.id,
            name: game.name,
            coverImageUrl: game.coverImageUrl
          })));
        } else if (gamesResult.data && gamesResult.data.data && Array.isArray(gamesResult.data.data)) {
          setGames(gamesResult.data.data.map((game: any) => ({
            id: game.id,
            name: game.name,
            coverImageUrl: game.coverImageUrl
          })));
        } else {
          setGames([]);
        }

        // Load categories  
        const categoriesResponse = await fetch('/api/guides/categories');
        const categoriesResult = await categoriesResponse.json();
        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      }
    };

    loadData();
  }, []);

  // Load guide data into form (only once when guide is first loaded)
  useEffect(() => {
    if (guide && !isInitialized) {
      // Set form values
      setValue('title', guide.title || '');
      setValue('summary', guide.summary || '');
      setValue('gameId', (guide as any).gameId || guide.game?.id || 0);
      setValue('guideCategoryId', (guide as any).guideCategoryId || guide.guideCategory?.id || undefined);
      setValue('difficulty', guide.difficulty || 'Orta');
      setValue('thumbnailUrl', (guide as any).thumbnailUrl || '');
      
      // Load existing tags
      if ((guide as any).tags && Array.isArray((guide as any).tags)) {
        setSelectedTags((guide as any).tags);
      }
      
      // Convert existing blocks to CreateGuideBlock format WITH IDs
      if (guide.guideBlocks && Array.isArray(guide.guideBlocks)) {
        const convertedBlocks: CreateGuideBlock[] = guide.guideBlocks
          .sort((a, b) => a.order - b.order)
          .map(block => ({
            id: block.id, // Mevcut block ID'sini sakla
            blockType: block.blockType,
            order: block.order,
            title: block.title || '',
            content: block.content || '',
            mediaUrl: block.mediaUrl || '',
            caption: block.caption || '',
            metadata: block.metadata || ''
          }));
        setBlocks(convertedBlocks.length > 0 ? convertedBlocks : [{ blockType: GuideBlockType.Text, order: 1, content: '' }]);
      }
      
      setIsInitialized(true);
    }
  }, [guide, setValue, isInitialized]);

  // Separate effect for auth check
  useEffect(() => {
    if (guide && user) {
      const isAuthor = guide.userId === user?.id || guide.author?.id === user?.id;
      const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Moderator;
      
      if (!isAuthor && !isAdmin) {
        toast.error('Bu kılavuzu düzenleme yetkiniz yok');
        navigate(`/guides/${id}`);
      }
    }
  }, [guide, user, id, navigate]);

  // Tag handling functions
  const handleTagAdd = () => {
    const trimmedTag = newTag.trim();
    
    // Validation checks
    if (!trimmedTag) {
      toast.error('Tag boş olamaz');
      return;
    }
    
    if (trimmedTag.length < 2) {
      toast.error('Tag en az 2 karakter olmalıdır');
      return;
    }
    
    if (trimmedTag.length > 15) {
      toast.error('Tag en fazla 15 karakter olabilir');
      return;
    }
    
    if (selectedTags.length >= 10) {
      toast.error('En fazla 10 adet tag ekleyebilirsiniz');
      return;
    }
    
    if (selectedTags.includes(trimmedTag)) {
      toast.error('Bu tag zaten eklenmiş');
      return;
    }
    
    setSelectedTags([...selectedTags, trimmedTag]);
    setNewTag('');
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Block management functions
  const addBlock = (type: GuideBlockType) => {
    const newBlock: CreateGuideBlock = {
      blockType: type,
      order: blocks.length + 1,
      content: type === GuideBlockType.Divider ? '---' : '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<CreateGuideBlock>) => {
    setBlocks(prevBlocks => {
      const updated = [...prevBlocks];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const removeBlock = (index: number) => {
    if (blocks.length > 1) {
      const updated = blocks.filter((_, i) => i !== index);
      updated.forEach((block, i) => {
        block.order = i + 1;
      });
      setBlocks(updated);
    }
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < blocks.length) {
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      newBlocks.forEach((block, i) => {
        block.order = i + 1;
      });
      setBlocks(newBlocks);
    }
  };

  // Update guide mutation
  const updateGuideMutation = useMutation({
    mutationFn: (data: any) => apiService.guides.update(parseInt(id!), data),
    onSuccess: () => {
      toast.success('Kılavuz başarıyla güncellendi!');
      navigate(`/guides/${id}`);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Kılavuz güncellenirken hata oluştu');
    }
  });

  const onSubmit = async (data: GuideFormData) => {
    if (!isAuthenticated) {
      toast.error('Kılavuzu güncellemek için giriş yapmalısınız');
      return;
    }

    if (blocks.length === 0 || blocks.every(block => !block.content?.trim() && !block.mediaUrl?.trim())) {
      toast.error('En az bir içerik bloğu eklemelisiniz');
      return;
    }

    if (selectedTags.length === 0) {
      toast.error('En az 1 adet tag eklemelisiniz');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        ...data,
        gameId: data.gameId && data.gameId > 0 ? data.gameId : null,
        tags: selectedTags,
        guideBlocks: blocks
          .filter(block => block.content?.trim() || block.mediaUrl?.trim() || block.blockType === GuideBlockType.Divider)
          .map((block, index) => ({
            id: block.id, // Mevcut block ID'sini koru
            blockType: block.blockType,
            order: index + 1,
            content: block.content || '',
            mediaUrl: block.mediaUrl || '',
            caption: block.caption || '',
            title: block.title || '',
            metadata: block.metadata || ''
          })),
      };

      updateGuideMutation.mutate(updateData);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBlockEditor = (block: CreateGuideBlock, index: number) => {
    switch (block.blockType) {
      case GuideBlockType.Text:
        return (
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Metin içeriğinizi yazın..."
            value={block.content || ''}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
          />
        );

      case GuideBlockType.Image:
        return (
          <div className="space-y-3">
            <input
              type="url"
              className="input"
              placeholder="Resim URL'si..."
              value={block.mediaUrl || ''}
              onChange={(e) => updateBlock(index, { mediaUrl: e.target.value })}
            />
            <input
              type="text"
              className="input"
              placeholder="Resim açıklaması (opsiyonel)..."
              value={block.caption || ''}
              onChange={(e) => updateBlock(index, { caption: e.target.value })}
            />
            {block.mediaUrl && (
              <img 
                src={block.mediaUrl} 
                alt="Preview" 
                className="max-w-xs h-auto rounded-lg shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        );

      case GuideBlockType.Video:
        return (
          <div className="space-y-3">
            <input
              type="url"
              className="input"
              placeholder="YouTube video URL'si (örn: https://www.youtube.com/watch?v=...)..."
              value={block.mediaUrl || ''}
              onChange={(e) => updateBlock(index, { mediaUrl: e.target.value })}
            />
            <input
              type="text"
              className="input"
              placeholder="Video açıklaması (opsiyonel)..."
              value={block.caption || ''}
              onChange={(e) => updateBlock(index, { caption: e.target.value })}
            />
          </div>
        );

      case GuideBlockType.List:
        return (
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Her satıra bir madde yazın..."
            value={block.content || ''}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
          />
        );

      case GuideBlockType.Quote:
        return (
          <textarea
            className="input border-l-4 border-primary-400 bg-primary-50 dark:bg-primary-900/20 resize-none"
            rows={3}
            placeholder="Önemli not veya alıntı..."
            value={block.content || ''}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
          />
        );

      case GuideBlockType.Divider:
        return (
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-100 dark:bg-dark-700 rounded-lg text-center text-gray-500 dark:text-gray-400">
            Desteklenmeyen blok türü
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Kılavuz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Kılavuz Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-400">Düzenlemek istediğiniz kılavuz mevcut değil.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Kılavuzu düzenlemek için giriş yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/guides/${id}`)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-gaming font-bold text-gray-900 dark:text-white">
                Kılavuzu Düzenle
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="btn-secondary flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Düzenle' : 'Önizle'}
              </button>
              
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || updateGuideMutation.isPending}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting || updateGuideMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {previewMode ? (
          /* Preview Mode */
          <div className="max-w-4xl mx-auto">
            <div className="card p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-gaming font-bold text-gray-900 dark:text-white mb-4">
                  {watchedValues.title || 'Rehber Başlığı'}
                </h1>
                {watchedValues.summary && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    {watchedValues.summary}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                  <span>@{user?.username}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString('tr-TR')}</span>
                  {watchedValues.difficulty && (
                    <>
                      <span>•</span>
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {watchedValues.difficulty}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {blocks.map((block, index) => (
                  <div key={index} className="mb-4">
                    {block.blockType === GuideBlockType.Text && block.content && (
                      <p>{block.content}</p>
                    )}
                    {block.blockType === GuideBlockType.Image && block.mediaUrl && (
                      <div className="text-center">
                        <img src={block.mediaUrl} alt={block.caption || ''} className="rounded-lg" />
                        {block.caption && <p className="text-sm text-gray-600 mt-2">{block.caption}</p>}
                      </div>
                    )}
                    {block.blockType === GuideBlockType.Video && block.mediaUrl && (
                      <div className="aspect-video">
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-8 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Video: {block.mediaUrl}</p>
                            {block.caption && <p className="text-xs text-gray-500 mt-1">{block.caption}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    {block.blockType === GuideBlockType.List && block.content && (
                      <ul>
                        {block.content.split('\n').map((item, i) => item.trim() && (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {block.blockType === GuideBlockType.Quote && block.content && (
                      <blockquote className="border-l-4 border-primary-400 pl-4 italic">
                        {block.content}
                      </blockquote>
                    )}
                    {block.blockType === GuideBlockType.Divider && (
                      <hr className="my-6" />
                    )}
                  </div>
                ))}
                {blocks.length === 0 && (
                  <p className="text-gray-500">İçerik blokları buraya gelecek...</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-8">
            {/* Basic Info */}
            <div className="card p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Başlık *
                  </label>
                  <input
                    {...register('title', {
                      required: 'Başlık gereklidir',
                      minLength: {
                        value: 5,
                        message: 'Başlık en az 5 karakter olmalıdır'
                      }
                    })}
                    type="text"
                    className={`input text-xl font-semibold ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="Rehberinizin başlığını girin..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Oyun (İsteğe bağlı)
                    </label>
                    <select
                      {...register('gameId')}
                      className="input"
                    >
                      <option value={0}>Oyun seçin (isteğe bağlı)...</option>
                      {Array.isArray(games) && games.map(game => (
                        <option key={game.id} value={game.id}>{game.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kategori
                    </label>
                    <select
                      {...register('guideCategoryId')}
                      className="input"
                    >
                      <option value="">Kategori seçin...</option>
                      {Array.isArray(categories) && categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zorluk Seviyesi *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {DIFFICULTY_OPTIONS.map(option => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          {...register('difficulty', { required: 'Zorluk seviyesi gereklidir' })}
                          type="radio"
                          value={option.value}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                          watchedValues.difficulty === option.value
                            ? `${option.border} ${option.bg} border-primary-500`
                            : 'border-gray-200 hover:border-gray-300 dark:border-dark-600'
                        }`}>
                          <div className="text-lg mb-1">{option.icon}</div>
                          <div className={`text-sm font-medium ${
                            watchedValues.difficulty === option.value ? option.color : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {option.label}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.difficulty && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.difficulty.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kısa Açıklama
                  </label>
                  <textarea
                    {...register('summary', {
                      required: 'Özet gereklidir',
                      minLength: {
                        value: 50,
                        message: 'Özet en az 50 karakter olmalıdır'
                      }
                    })}
                    rows={3}
                    className={`input resize-none ${errors.summary ? 'border-red-500' : ''}`}
                    placeholder="Rehberinizin kısa bir özetini yazın... (En az 50 karakter)"
                  />
                  {errors.summary && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.summary.message}
                    </p>
                  )}
                </div>

                {/* User Generated Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Etiketler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                      placeholder="Etiket ekle..."
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleTagAdd}
                      className="btn-secondary"
                    >
                      Ekle
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kapak Görseli URL
                  </label>
                  <input
                    {...register('thumbnailUrl')}
                    type="url"
                    className="input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="card p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    İçerik Blokları *
                  </label>
                  <div className="flex items-center space-x-2">
                    {BLOCK_TYPES.map((blockType) => (
                      <button
                        key={blockType.type}
                        type="button"
                        onClick={() => addBlock(blockType.type)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                        title={`${blockType.name} Ekle`}
                      >
                        <blockType.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div key={index} className="border border-gray-200 dark:border-dark-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {React.createElement(BLOCK_TYPES.find(bt => bt.type === block.blockType)?.icon || Type, { className: "w-4 h-4" })}
                            {BLOCK_TYPES.find(bt => bt.type === block.blockType)?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, 'down')}
                            disabled={index === blocks.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(index)}
                            disabled={blocks.length === 1}
                            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {renderBlockEditor(block, index)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(`/guides/${id}`)}
                className="btn-secondary"
              >
                İptal
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || updateGuideMutation.isPending}
                className="btn-primary disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting || updateGuideMutation.isPending ? 'Güncelleniyor...' : 'Kılavuzu Güncelle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Export component
export default EditGuidePage;