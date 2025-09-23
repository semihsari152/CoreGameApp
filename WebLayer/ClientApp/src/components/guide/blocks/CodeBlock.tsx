import React, { useState } from 'react';
import { GuideBlock } from '../../../types/guide';

interface CodeBlockProps {
  block: GuideBlock;
  isEditing: boolean;
  onChange: (content: string, metadata?: string) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  block,
  isEditing,
  onChange,
  onStartEdit,
  onStopEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [code, setCode] = useState(block.content || '');
  const [language, setLanguage] = useState(() => {
    try {
      return JSON.parse(block.metadata || '{}').language || 'javascript';
    } catch {
      return 'javascript';
    }
  });

  const languages = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
    'html', 'css', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift',
    'sql', 'json', 'xml', 'yaml', 'bash', 'powershell'
  ];

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    const metadata = JSON.stringify({ language });
    onChange(newCode, metadata);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    const metadata = JSON.stringify({ language: newLanguage });
    onChange(code, metadata);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
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
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            {isEditing ? (
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border-none outline-none"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            ) : (
              <span className="text-gray-400 text-sm">{language}</span>
            )}
          </div>
          
          {!isEditing && (
            <button
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700"
              title="Kopyala"
            >
              📋 Kopyala
            </button>
          )}
        </div>

        {/* Code Area */}
        {isEditing ? (
          <div className="p-4">
            <textarea
              value={code}
              onChange={handleCodeChange}
              onBlur={onStopEdit}
              placeholder="Kodunuzu buraya yazın..."
              className="w-full bg-transparent text-green-400 font-mono text-sm resize-none border-none outline-none"
              style={{ minHeight: '120px' }}
              spellCheck={false}
            />
            <div className="text-xs text-gray-500 mt-2">
              ESC tuşu ile çıkış
            </div>
          </div>
        ) : (
          <div
            onClick={onStartEdit}
            className="p-4 cursor-text"
          >
            {code ? (
              <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                {code}
              </pre>
            ) : (
              <div className="text-gray-500 font-mono text-sm">
                Kod eklemek için tıklayın...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;