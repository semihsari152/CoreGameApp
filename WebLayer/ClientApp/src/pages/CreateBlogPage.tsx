import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { 
  Save, 
  Eye, 
  Upload, 
  X, 
  ArrowLeft,
  PenTool,
  Image as ImageIcon,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  categories: string[];
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  isPublished: boolean;
}

const CreateBlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BlogFormData>({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      categories: [],
      isPublished: true
    }
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: BlogFormData) => api.blogs.create({
      ...data,
      categories: selectedCategories
    }),
    onSuccess: (response) => {
      toast.success('Blog yazısı başarıyla oluşturuldu!');
      // API response'un yapısını kontrol edip navigate et
      const blogId = response?.id || response?.data?.id || Math.floor(Math.random() * 1000);
      navigate(`/blogs/${blogId}`);
    },
    onError: () => {
      toast.error('Blog yazısı oluşturulurken bir hata oluştu');
    }
  });

  const watchedContent = watch('content');
  const watchedTitle = watch('title');
  const watchedExcerpt = watch('excerpt');

  const handleCategoryAdd = () => {
    if (newCategory.trim() && !selectedCategories.includes(newCategory.trim())) {
      setSelectedCategories([...selectedCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleCategoryRemove = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const onSubmit = (data: BlogFormData) => {
    if (!isAuthenticated) {
      toast.error('Blog yazısı oluşturmak için giriş yapmalısınız');
      return;
    }
    createBlogMutation.mutate(data);
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;
    
    const currentContent = watch('content');
    const newContent = currentContent.substring(0, start) + newText + currentContent.substring(end);
    
    setValue('content', newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: 'Kalın', action: () => insertText('**', '**') },
    { icon: Italic, label: 'İtalik', action: () => insertText('*', '*') },
    { icon: LinkIcon, label: 'Link', action: () => insertText('[', '](url)') },
    { icon: Quote, label: 'Alıntı', action: () => insertText('> ') },
    { icon: Code, label: 'Kod', action: () => insertText('`', '`') },
    { icon: List, label: 'Liste', action: () => insertText('- ') },
    { icon: ListOrdered, label: 'Numaralı Liste', action: () => insertText('1. ') },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Blog yazısı oluşturmak için giriş yapmalısınız.
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
                onClick={() => navigate('/blog')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-gaming font-bold text-gray-900 dark:text-white">
                Yeni Blog Yazısı
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
                disabled={createBlogMutation.isLoading}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {createBlogMutation.isLoading ? 'Yayınlanıyor...' : 'Yayınla'}
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
                  {watchedTitle || 'Blog Başlığı'}
                </h1>
                {watchedExcerpt && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    {watchedExcerpt}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                  <span>@{user?.username}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: watchedContent?.replace(/\n/g, '<br>') || 'İçerik buraya gelecek...' 
                }} />
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
                    placeholder="Blog yazınızın başlığını girin..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Özet
                  </label>
                  <textarea
                    {...register('excerpt')}
                    rows={3}
                    className="input resize-none"
                    placeholder="Blog yazınızın kısa bir özetini yazın..."
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategoriler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCategories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => handleCategoryRemove(category)}
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
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCategoryAdd())}
                      placeholder="Kategori ekle..."
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleCategoryAdd}
                      className="btn-secondary"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="card p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    İçerik *
                  </label>
                  <div className="flex items-center space-x-1">
                    {formatButtons.map((button) => (
                      <button
                        key={button.label}
                        type="button"
                        onClick={button.action}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                        title={button.label}
                      >
                        <button.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <textarea
                  id="content"
                  {...register('content', {
                    required: 'İçerik gereklidir',
                    minLength: {
                      value: 50,
                      message: 'İçerik en az 50 karakter olmalıdır'
                    }
                  })}
                  rows={20}
                  className={`input resize-none font-mono ${errors.content ? 'border-red-500' : ''}`}
                  placeholder="Blog yazınızın içeriğini buraya yazın...

Markdown formatını kullanabilirsiniz:
- **Kalın metin**
- *İtalik metin*
- [Link](https://example.com)
- > Alıntı
- `Kod`
- # Başlık
- ## Alt başlık"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </div>

            {/* Media Upload */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Medya
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Banner Görseli URL
                  </label>
                  <input
                    {...register('bannerImageUrl')}
                    type="url"
                    className="input"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Yayın Ayarları
              </h3>
              <div className="flex items-center">
                <input
                  {...register('isPublished')}
                  type="checkbox"
                  id="isPublished"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hemen yayınla (işaretlemezsaniz taslak olarak kaydedilir)
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="btn-secondary"
              >
                İptal
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setValue('isPublished', false);
                    handleSubmit(onSubmit)();
                  }}
                  disabled={createBlogMutation.isLoading}
                  className="btn-secondary disabled:opacity-50"
                >
                  Taslak Kaydet
                </button>
                <button
                  type="submit"
                  disabled={createBlogMutation.isLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createBlogMutation.isLoading ? 'Yayınlanıyor...' : 'Yayınla'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateBlogPage;