import React, { useState, useRef } from 'react';
import { GuideBlock } from '../../../types/guide';

interface ImageBlockProps {
  block: GuideBlock;
  isEditing: boolean;
  onChange: (mediaUrl: string, caption?: string) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({
  block,
  isEditing,
  onChange,
  onStartEdit,
  onStopEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [imageUrl, setImageUrl] = useState(block.mediaUrl || '');
  const [caption, setCaption] = useState(block.caption || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    onChange(url, caption);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCaption = e.target.value;
    setCaption(newCaption);
    onChange(imageUrl, newCaption);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement file upload to your storage service
      // For now, create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setImageUrl(tempUrl);
      onChange(tempUrl, caption);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="group relative border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg p-4 transition-colors">
      {/* Block Controls */}
      <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col space-y-1">
          <button
            onClick={onMoveUp}
            className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center justify-center text-xs"
            title="Yukarı taşı"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            className="w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center justify-center text-xs"
            title="Aşağı taşı"
          >
            ↓
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 rounded flex items-center justify-center text-xs"
            title="Sil"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Image Display/Upload Area */}
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={caption || 'Guide image'}
              className="max-w-full h-auto rounded-lg shadow-sm"
              onError={() => {
                setImageUrl('');
                onChange('', caption);
              }}
            />
            {isEditing && (
              <button
                onClick={() => {
                  setImageUrl('');
                  onChange('', caption);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                title="Resmi kaldır"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={isEditing ? onStartEdit : undefined}
            className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center ${
              isEditing ? 'cursor-pointer hover:border-blue-500' : 'cursor-default'
            }`}
          >
            {isUploading ? (
              <div className="text-blue-500">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Yükleniyor...
              </div>
            ) : (
              <>
                <div className="text-4xl text-gray-400 mb-2">🖼️</div>
                <div className="text-gray-500 dark:text-gray-400">
                  {isEditing ? 'Resim eklemek için tıklayın' : 'Resim yok'}
                </div>
              </>
            )}
          </div>
        )}

        {/* Edit Controls */}
        {isEditing && (
          <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                📁 Dosya Yükle
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resim URL'si
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama (İsteğe bağlı)
              </label>
              <input
                type="text"
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Resim açıklaması..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={onStopEdit}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                ✓ Kaydet
              </button>
            </div>
          </div>
        )}

        {/* Caption Display */}
        {caption && !isEditing && (
          <div className="text-center text-gray-600 dark:text-gray-400 italic text-sm">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageBlock;