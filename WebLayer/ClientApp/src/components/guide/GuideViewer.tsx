import React from 'react';
import { GuideBlock, GuideBlockType } from '../../types/guide';

interface GuideViewerProps {
  blocks: GuideBlock[];
  className?: string;
}

const GuideViewer: React.FC<GuideViewerProps> = ({ blocks, className = '' }) => {
  const renderBlock = (block: GuideBlock) => {
    switch (block.blockType) {
      case GuideBlockType.Text:
        return <TextBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Image:
        return <ImageBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Video:
        return <VideoBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Code:
        return <CodeBlockView key={block.id} block={block} />;
      
      case GuideBlockType.List:
        return <ListBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Quote:
        return <QuoteBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Divider:
        return <DividerBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Gallery:
        return <GalleryBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Link:
        return <LinkBlockView key={block.id} block={block} />;
      
      case GuideBlockType.Table:
        return <TableBlockView key={block.id} block={block} />;
      
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {blocks
        .sort((a, b) => a.order - b.order)
        .map(renderBlock)}
    </div>
  );
};

// Text Block View
const TextBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.content?.trim()) return null;

  return (
    <div className="prose dark:prose-invert max-w-none">
      {block.content.split('\n').map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{line.slice(4)}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={index} className="font-bold mb-3 text-gray-900 dark:text-white">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
          return <p key={index} className="italic mb-3 text-gray-700 dark:text-gray-300">{line.slice(1, -1)}</p>;
        }
        if (line.trim() === '') {
          return <div key={index} className="mb-3"></div>;
        }
        return <p key={index} className="mb-3 text-gray-800 dark:text-gray-200 leading-relaxed">{line}</p>;
      })}
    </div>
  );
};

// Image Block View
const ImageBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.mediaUrl) return null;

  return (
    <div className="text-center">
      <img
        src={block.mediaUrl}
        alt={block.caption || 'Guide image'}
        className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
        loading="lazy"
      />
      {block.caption && (
        <p className="mt-3 text-gray-600 dark:text-gray-400 italic text-sm">
          {block.caption}
        </p>
      )}
    </div>
  );
};

// Video Block View
const VideoBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.mediaUrl) return null;

  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(block.mediaUrl);

  if (youtubeId) {
    return (
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={block.caption || 'Video'}
          className="w-full h-full rounded-lg"
          allowFullScreen
        />
        {block.caption && (
          <p className="mt-3 text-gray-600 dark:text-gray-400 italic text-sm text-center">
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Video yüklenemedi</p>
    </div>
  );
};

// Code Block View
const CodeBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.content) return null;

  const metadata = block.metadata ? JSON.parse(block.metadata) : {};
  const language = metadata.language || 'text';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(block.content || '');
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-400 text-sm">{language}</span>
        </div>
        
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          title="Kopyala"
        >
          📋 Kopyala
        </button>
      </div>

      {/* Code */}
      <div className="p-4">
        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
          {block.content}
        </pre>
      </div>
    </div>
  );
};

// List Block View
const ListBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.content) return null;

  const lines = block.content.split('\n').filter(line => line.trim());
  const metadata = block.metadata ? JSON.parse(block.metadata) : {};
  const isNumbered = metadata.numbered || false;

  return (
    <div className="pl-4">
      {isNumbered ? (
        <ol className="list-decimal list-inside space-y-2">
          {lines.map((line, index) => (
            <li key={index} className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {line.replace(/^[\d\.\-\*\+]\s*/, '')}
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc list-inside space-y-2">
          {lines.map((line, index) => (
            <li key={index} className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {line.replace(/^[\d\.\-\*\+]\s*/, '')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Quote Block View
const QuoteBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.content) return null;

  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg">
      <div className="flex items-start space-x-3">
        <div className="text-blue-500 text-2xl">💡</div>
        <div>
          {block.title && (
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {block.title}
            </h4>
          )}
          <p className="text-blue-800 dark:text-blue-200 italic">
            {block.content}
          </p>
        </div>
      </div>
    </div>
  );
};

// Divider Block View
const DividerBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  return (
    <div className="flex items-center justify-center my-8">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
    </div>
  );
};

// Placeholder implementations for other block types
const GalleryBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <p className="text-gray-500 dark:text-gray-400 text-center">Gallery block - Not implemented yet</p>
    </div>
  );
};

const LinkBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  if (!block.mediaUrl) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <a
        href={block.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <div className="text-2xl">🔗</div>
        <div>
          <div className="font-medium">{block.title || block.mediaUrl}</div>
          {block.content && (
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {block.content}
            </div>
          )}
        </div>
      </a>
    </div>
  );
};

const TableBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <p className="text-gray-500 dark:text-gray-400 text-center">Table block - Not implemented yet</p>
    </div>
  );
};

export default GuideViewer;