import React, { useState } from 'react';
import { GuideBlockType, BlockTypeDefinition } from '../../types/guide';

interface BlockTypeSelectorProps {
  onSelectBlock: (blockType: GuideBlockType) => void;
  onClose: () => void;
  isOpen: boolean;
}

const blockTypes: BlockTypeDefinition[] = [
  {
    type: GuideBlockType.Text,
    name: 'Metin',
    icon: '📝',
    description: 'Zengin metin ve markdown desteği',
    category: 'basic'
  },
  {
    type: GuideBlockType.Image,
    name: 'Görsel',
    icon: '🖼️',
    description: 'Resim yükle veya URL ekle',
    category: 'media'
  },
  {
    type: GuideBlockType.Video,
    name: 'Video',
    icon: '🎥',
    description: 'YouTube veya video embed',
    category: 'media'
  },
  {
    type: GuideBlockType.Code,
    name: 'Kod',
    icon: '💻',
    description: 'Kod bloğu syntax highlighting ile',
    category: 'advanced'
  },
  {
    type: GuideBlockType.List,
    name: 'Liste',
    icon: '📋',
    description: 'Adım adım numaralı/noktalı liste',
    category: 'basic'
  },
  {
    type: GuideBlockType.Quote,
    name: 'Alıntı',
    icon: '💡',
    description: 'Önemli not veya uyarı',
    category: 'basic'
  },
  {
    type: GuideBlockType.Divider,
    name: 'Ayırıcı',
    icon: '➖',
    description: 'Bölüm ayırıcı çizgi',
    category: 'basic'
  },
  {
    type: GuideBlockType.Gallery,
    name: 'Galeri',
    icon: '🖼️',
    description: 'Çoklu resim galerisi',
    category: 'media'
  },
  {
    type: GuideBlockType.Link,
    name: 'Link',
    icon: '🔗',
    description: 'Harici link preview ile',
    category: 'basic'
  },
  {
    type: GuideBlockType.Table,
    name: 'Tablo',
    icon: '📊',
    description: 'Veri tablosu',
    category: 'advanced'
  }
];

const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({ 
  onSelectBlock, 
  onClose, 
  isOpen 
}) => {
  const [activeCategory, setActiveCategory] = useState<'basic' | 'media' | 'advanced'>('basic');

  if (!isOpen) return null;

  const filteredBlocks = blockTypes.filter(block => block.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Blok Türü Seç</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveCategory('basic')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeCategory === 'basic' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Temel
          </button>
          <button
            onClick={() => setActiveCategory('media')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeCategory === 'media' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Medya
          </button>
          <button
            onClick={() => setActiveCategory('advanced')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeCategory === 'advanced' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Gelişmiş
          </button>
        </div>

        {/* Block Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredBlocks.map((block) => (
              <button
                key={block.type}
                onClick={() => {
                  onSelectBlock(block.type);
                  onClose();
                }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="text-2xl mb-2">{block.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {block.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {block.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockTypeSelector;