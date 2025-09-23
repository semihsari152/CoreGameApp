import React, { useState, useRef, useEffect } from 'react';
import { GuideBlock } from '../../../types/guide';

interface TextBlockProps {
  block: GuideBlock;
  isEditing: boolean;
  onChange: (content: string) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const TextBlock: React.FC<TextBlockProps> = ({
  block,
  isEditing,
  onChange,
  onStartEdit,
  onStopEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [content, setContent] = useState(block.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent);
    
    // Auto resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onStopEdit();
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
      {isEditing ? (
        <div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onBlur={onStopEdit}
            onKeyDown={handleKeyDown}
            placeholder="Metninizi buraya yazın... (Ctrl+Enter ile kaydet)"
            className="w-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            style={{ minHeight: '60px' }}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Markdown desteklenir • Ctrl+Enter ile kaydet
          </div>
        </div>
      ) : (
        <div
          onClick={onStartEdit}
          className="cursor-text min-h-[60px] flex items-center"
        >
          {content ? (
            <div className="prose dark:prose-invert max-w-none">
              {/* Simple markdown rendering - you can integrate a proper markdown parser */}
              {content.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-bold mb-3">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={index} className="text-lg font-bold mb-2">{line.slice(4)}</h3>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={index} className="font-bold mb-2">{line.slice(2, -2)}</p>;
                }
                if (line.startsWith('*') && line.endsWith('*')) {
                  return <p key={index} className="italic mb-2">{line.slice(1, -1)}</p>;
                }
                return <p key={index} className="mb-2">{line || '\u00A0'}</p>;
              })}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              Metin eklemek için tıklayın...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextBlock;