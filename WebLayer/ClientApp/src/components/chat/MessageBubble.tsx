import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Reply, 
  MoreVertical, 
  Clock, 
  Check, 
  CheckCheck,
  Heart,
  Smile,
  ThumbsUp,
  Angry,
  Trash2,
  Copy
} from 'lucide-react';
import { Message } from '../../types/messaging';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onReaction: (messageId: number, emoji: string) => void;
  onDelete: (messageId: number) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  onReply, 
  onReaction,
  onDelete
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const commonReactions = ['❤️', '👍', '😀', '😮', '😢', '😡'];

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleReactionClick = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowReactions(false);
  };

  const handleCopyMessage = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    } else if (message.mediaUrl) {
      navigator.clipboard.writeText(message.mediaUrl);
    }
    setShowOptions(false);
  };

  const handleDeleteMessage = () => {
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      onDelete(message.id);
    }
    setShowOptions(false);
  };

  const handleAvatarClick = () => {
    if (!isOwn && message.sender?.username) {
      navigate(`/profile/${message.sender.username}`);
    }
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const getMessageStatusIcon = () => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderMedia = () => {
    if (!message.mediaUrl) return null;

    const mediaType = message.mediaType || 'link';
    const url = message.mediaUrl;

    // Function to convert GIF service URLs to direct URLs
    const getDirectImageUrl = (url: string) => {
      if (url.includes('giphy.com')) {
        // Handle different Giphy URL formats
        if (url.includes('/gifs/')) {
          const match = url.match(/\/gifs\/[^\/]*-([a-zA-Z0-9]+)/);
          if (match) return `https://media.giphy.com/media/${match[1]}/giphy.gif`;
        }
        if (url.includes('/media/')) {
          return url.endsWith('.gif') ? url : url + '/giphy.gif';
        }
        // Try to extract ID from any Giphy URL - more flexible regex
        const giphyMatch = url.match(/giphy\.com\/(?:gifs\/)?(?:[^\/]*-)?([a-zA-Z0-9]{10,})/);
        if (giphyMatch) return `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
        
        // Handle embed URLs
        if (url.includes('/embed/')) {
          const embedMatch = url.match(/embed\/([a-zA-Z0-9]+)/);
          if (embedMatch) return `https://media.giphy.com/media/${embedMatch[1]}/giphy.gif`;
        }
      }
      if (url.includes('tenor.com')) {
        // For Tenor GIFs, try different approaches
        if (url.includes('-gif-')) {
          // Extract ID from URL and construct media URL
          const tenorMatch = url.match(/-([0-9]+)$/);
          if (tenorMatch) {
            // Use Tenor's media API format
            return `https://media.tenor.com/images/${tenorMatch[1]}/tenor.gif`;
          }
        }
        // If it's already a direct media URL, return as-is
        if (url.includes('media.tenor.com') || url.includes('c.tenor.com')) {
          return url;
        }
      }
      return url;
    };

    // Auto-detect image URLs
    if (mediaType.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || 
        url.includes('giphy.com') || url.includes('tenor.com')) {
      return (
        <div className="mt-2 max-w-xs">
          <img 
            src={getDirectImageUrl(url)} 
            alt="Shared media"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, '_blank')}
            onError={(e) => {
              // If image fails to load, show as link
              e.currentTarget.style.display = 'none';
              const linkDiv = document.createElement('div');
              linkDiv.className = 'mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500';
              linkDiv.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all">${url}</a>`;
              e.currentTarget.parentNode?.appendChild(linkDiv);
            }}
          />
        </div>
      );
    }

    // Auto-detect video URLs
    if (mediaType.startsWith('video/') || url.match(/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i)) {
      return (
        <div className="mt-2 max-w-xs">
          <video 
            src={url} 
            controls
            className="rounded-lg max-w-full h-auto"
          />
        </div>
      );
    }

    // Check for YouTube, Giphy, Tenor URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      
      if (videoId) {
        return (
          <div className="mt-2 max-w-xs">
            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              frameBorder="0"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        );
      }
    }

    // For other links, show as clickable link
    return (
      <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all"
        >
          {url}
        </a>
      </div>
    );
  };

  const getReactionCount = (emoji: string) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const hasUserReacted = (emoji: string) => {
    return message.reactions?.some(r => r.emoji === emoji && r.userId === message.sender.id) || false;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        {/* Reply preview */}
        {message.replyToMessage && (
          <div className="mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-gray-400">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {message.replyToMessage.sender.username}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
              {message.replyToMessage.content || 'Medya mesajı'}
            </p>
          </div>
        )}

        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
          }`}
        >
          {/* Message content - Hide if it's just a media URL */}
          {message.content && (() => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = message.content.match(urlRegex);
            
            // If message is just a single URL that we can display as media, hide the text
            if (urls && urls.length === 1 && message.content.trim() === urls[0]) {
              const url = urls[0];
              if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mov|avi)(\?.*)?$/i) ||
                  url.includes('youtube.com') || url.includes('youtu.be') ||
                  url.includes('giphy.com') || url.includes('tenor.com')) {
                return null; // Hide text if it's just a media URL
              }
            }
            
            return (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            );
          })()}
          
          {/* Auto-detect URLs in message content */}
          {message.content && !message.mediaUrl && (() => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = message.content.match(urlRegex);
            if (urls && urls.length > 0) {
              const firstUrl = urls[0];
              
              // Function to convert GIF service URLs to direct URLs
              const getDirectImageUrl = (url: string) => {
                if (url.includes('giphy.com')) {
                  // Handle different Giphy URL formats
                  if (url.includes('/gifs/')) {
                    const match = url.match(/\/gifs\/[^\/]*-([a-zA-Z0-9]+)/);
                    if (match) return `https://media.giphy.com/media/${match[1]}/giphy.gif`;
                  }
                  if (url.includes('/media/')) {
                    return url.endsWith('.gif') ? url : url + '/giphy.gif';
                  }
                  // Try to extract ID from any Giphy URL - more flexible regex
                  const giphyMatch = url.match(/giphy\.com\/(?:gifs\/)?(?:[^\/]*-)?([a-zA-Z0-9]{10,})/);
                  if (giphyMatch) return `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
                  
                  // Handle embed URLs
                  if (url.includes('/embed/')) {
                    const embedMatch = url.match(/embed\/([a-zA-Z0-9]+)/);
                    if (embedMatch) return `https://media.giphy.com/media/${embedMatch[1]}/giphy.gif`;
                  }
                }
                if (url.includes('tenor.com')) {
                  // For Tenor GIFs, try different approaches
                  if (url.includes('-gif-')) {
                    // Extract ID from URL and construct media URL
                    const tenorMatch = url.match(/-([0-9]+)$/);
                    if (tenorMatch) {
                      // Use Tenor's media API format
                      return `https://media.tenor.com/images/${tenorMatch[1]}/tenor.gif`;
                    }
                  }
                  // If it's already a direct media URL, return as-is
                  if (url.includes('media.tenor.com') || url.includes('c.tenor.com')) {
                    return url;
                  }
                }
                return url;
              };
              
              // Check if it's an image or video URL
              if (firstUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mov|avi)(\?.*)?$/i) ||
                  firstUrl.includes('youtube.com') || firstUrl.includes('youtu.be') ||
                  firstUrl.includes('giphy.com') || firstUrl.includes('tenor.com')) {
                return (
                  <div className="mt-2">
                    {(firstUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) ||
                      firstUrl.includes('giphy.com') || firstUrl.includes('tenor.com')) ? (
                      <img 
                        src={getDirectImageUrl(firstUrl)} 
                        alt="Shared media"
                        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(firstUrl, '_blank')}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : firstUrl.includes('youtube.com') || firstUrl.includes('youtu.be') ? (
                      (() => {
                        const videoId = firstUrl.includes('youtu.be') 
                          ? firstUrl.split('youtu.be/')[1]?.split('?')[0]
                          : firstUrl.split('v=')[1]?.split('&')[0];
                        
                        return videoId ? (
                          <iframe
                            width="100%"
                            height="200"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video"
                            frameBorder="0"
                            allowFullScreen
                            className="rounded-lg"
                          />
                        ) : null;
                      })()
                    ) : null}
                  </div>
                );
              }
            }
            return null;
          })()}

          {/* Media content */}
          {renderMedia()}

          {/* Message info */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatMessageTime(message.createdAt)}
            </span>
            {getMessageStatusIcon()}
          </div>

          {/* Action buttons */}
          <div className={`absolute top-0 ${isOwn ? 'left-0 -ml-20' : 'right-0 -mr-20'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Tepki ekle"
            >
              <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Yanıtla"
            >
              <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="relative" ref={optionsRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Daha fazla"
              >
                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              {/* Options dropdown */}
              {showOptions && (
                <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-8 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20`}>
                  <button
                    onClick={handleCopyMessage}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Kopyala
                  </button>
                  {isOwn && (
                    <button
                      onClick={handleDeleteMessage}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Sil
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick reactions popup */}
          {showReactions && (
            <div className={`absolute ${isOwn ? 'left-0 -ml-4' : 'right-0 -mr-4'} -top-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 px-2 py-1 flex gap-1 z-10`}>
              {commonReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1 rounded"
                  title={`${emoji} ekle`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                  hasUserReacted(emoji)
                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Avatar for non-own messages */}
      {!isOwn && (
        <button 
          onClick={handleAvatarClick}
          className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ml-2 order-1 flex-shrink-0 hover:scale-110 transition-transform cursor-pointer`}
          title={`${message.sender.username} profiline git`}
        >
          <span className="text-white text-sm font-semibold">
            {message.sender.username.charAt(0).toUpperCase()}
          </span>
        </button>
      )}
    </div>
  );
}; 

export default MessageBubble;