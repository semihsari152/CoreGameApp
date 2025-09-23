import React, { useState, useCallback } from 'react';
import { GuideBlock, GuideBlockType, CreateGuideBlock } from '../../types/guide';
import BlockTypeSelector from './BlockTypeSelector';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import CodeBlock from './blocks/CodeBlock';

interface GuideEditorProps {
  initialBlocks?: GuideBlock[];
  onChange: (blocks: CreateGuideBlock[]) => void;
}

const GuideEditor: React.FC<GuideEditorProps> = ({ 
  initialBlocks = [], 
  onChange 
}) => {
  const [blocks, setBlocks] = useState<GuideBlock[]>(
    initialBlocks.length > 0 
      ? initialBlocks 
      : [{
          id: Date.now(),
          guideId: 0,
          blockType: GuideBlockType.Text,
          order: 0,
          content: '',
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString()
        }]
  );
  
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [insertPosition, setInsertPosition] = useState(0);

  // Convert blocks to CreateGuideBlock format and notify parent
  const notifyParent = useCallback((updatedBlocks: GuideBlock[]) => {
    const createBlocks: CreateGuideBlock[] = updatedBlocks.map((block, index) => ({
      blockType: block.blockType,
      order: index,
      content: block.content,
      mediaUrl: block.mediaUrl,
      caption: block.caption,
      title: block.title,
      metadata: block.metadata
    }));
    onChange(createBlocks);
  }, [onChange]);

  // Add new block
  const addBlock = (blockType: GuideBlockType, position: number) => {
    const newBlock: GuideBlock = {
      id: Date.now(),
      guideId: 0,
      blockType,
      order: position,
      content: '',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };

    const updatedBlocks = [...blocks];
    updatedBlocks.splice(position, 0, newBlock);
    
    // Update order of subsequent blocks
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });

    setBlocks(updatedBlocks);
    setEditingBlockId(newBlock.id);
    notifyParent(updatedBlocks);
  };

  // Update block content
  const updateBlock = (blockId: number, updates: Partial<GuideBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updatedDate: new Date().toISOString() }
        : block
    );
    setBlocks(updatedBlocks);
    notifyParent(updatedBlocks);
  };

  // Delete block
  const deleteBlock = (blockId: number) => {
    if (blocks.length <= 1) return; // Keep at least one block
    
    const updatedBlocks = blocks
      .filter(block => block.id !== blockId)
      .map((block, index) => ({ ...block, order: index }));
    
    setBlocks(updatedBlocks);
    notifyParent(updatedBlocks);
  };

  // Move block up
  const moveBlockUp = (blockId: number) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex <= 0) return;

    const updatedBlocks = [...blocks];
    [updatedBlocks[blockIndex], updatedBlocks[blockIndex - 1]] = 
    [updatedBlocks[blockIndex - 1], updatedBlocks[blockIndex]];
    
    // Update orders
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });

    setBlocks(updatedBlocks);
    notifyParent(updatedBlocks);
  };

  // Move block down
  const moveBlockDown = (blockId: number) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex >= blocks.length - 1) return;

    const updatedBlocks = [...blocks];
    [updatedBlocks[blockIndex], updatedBlocks[blockIndex + 1]] = 
    [updatedBlocks[blockIndex + 1], updatedBlocks[blockIndex]];
    
    // Update orders
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });

    setBlocks(updatedBlocks);
    notifyParent(updatedBlocks);
  };

  // Render individual block
  const renderBlock = (block: GuideBlock) => {
    const commonProps = {
      block,
      isEditing: editingBlockId === block.id,
      onStartEdit: () => setEditingBlockId(block.id),
      onStopEdit: () => setEditingBlockId(null),
      onDelete: () => deleteBlock(block.id),
      onMoveUp: () => moveBlockUp(block.id),
      onMoveDown: () => moveBlockDown(block.id)
    };

    switch (block.blockType) {
      case GuideBlockType.Text:
        return (
          <TextBlock
            key={block.id}
            {...commonProps}
            onChange={(content) => updateBlock(block.id, { content })}
          />
        );

      case GuideBlockType.Image:
        return (
          <ImageBlock
            key={block.id}
            {...commonProps}
            onChange={(mediaUrl, caption) => updateBlock(block.id, { mediaUrl, caption })}
          />
        );

      case GuideBlockType.Code:
        return (
          <CodeBlock
            key={block.id}
            {...commonProps}
            onChange={(content, metadata) => updateBlock(block.id, { content, metadata })}
          />
        );

      // Add other block types here
      default:
        return (
          <div key={block.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="text-gray-500">
              Block type {block.blockType} not implemented yet
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Editor Container */}
      <div className="relative pl-16">
        {/* Blocks */}
        {blocks.map((block, index) => (
          <div key={block.id} className="mb-4">
            {renderBlock(block)}
            
            {/* Add Block Button - appears between blocks */}
            <div className="flex justify-center py-2">
              <button
                onClick={() => {
                  setInsertPosition(index + 1);
                  setShowBlockSelector(true);
                }}
                className="opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-50 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                title="Blok ekle"
              >
                +
              </button>
            </div>
          </div>
        ))}

        {/* Add First Block Button (if no blocks) */}
        {blocks.length === 0 && (
          <div className="text-center py-12">
            <button
              onClick={() => {
                setInsertPosition(0);
                setShowBlockSelector(true);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + İlk bloğu ekle
            </button>
          </div>
        )}
      </div>

      {/* Block Type Selector Modal */}
      <BlockTypeSelector
        isOpen={showBlockSelector}
        onClose={() => setShowBlockSelector(false)}
        onSelectBlock={(blockType) => addBlock(blockType, insertPosition)}
      />

      {/* Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{blocks.length} blok</span>
          <span>•</span>
          <span>Son kaydet: Az önce</span>
          <span>•</span>
          <button
            onClick={() => {
              setInsertPosition(blocks.length);
              setShowBlockSelector(true);
            }}
            className="text-blue-500 hover:text-blue-600"
          >
            + Blok ekle
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideEditor;