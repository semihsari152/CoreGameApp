import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Image, Video, Link, AlertCircle, Loader } from 'lucide-react';

interface MediaPreviewProps {
  url: string;
  onRemove: () => void;
}

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ url, onRemove }) => {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMediaType = (url: string): string => {
    const lower = url.toLowerCase();
    
    // Check for direct file extensions first
    if (lower.includes('.gif') || lower.endsWith('.gif')) return 'image/gif';
    if (lower.match(/\.(jpg|jpeg|png|webp|svg|bmp|ico)$/)) return 'image';
    if (lower.match(/\.(mp4|mov|avi|webm|mkv|3gp|flv)$/)) return 'video';
    if (lower.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/)) return 'audio';
    
    // Check for popular media services
    if (lower.includes('giphy.com') || lower.includes('tenor.com')) {
      return 'image/gif';
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return 'video';
    }
    if (lower.includes('imgur.com')) {
      // Check if it's a direct image link or gallery
      if (lower.match(/imgur\.com\/[\w]+\.(jpg|jpeg|png|gif|webp)$/)) {
        return lower.includes('.gif') ? 'image/gif' : 'image';
      }
      return 'image'; // Most imgur links are images
    }
    
    // Handle common image hosting services
    if (lower.includes('cdn.discordapp.com') || lower.includes('media.discordapp.net')) {
      if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return lower.includes('.gif') ? 'image/gif' : 'image';
      }
    }
    
    return 'link';
  };

  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Bilinmeyen site';
    }
  };

  const fetchLinkPreview = async (url: string) => {
    // Bu basit bir örnek implementation'dır
    // Gerçek uygulamada backend'den link preview servisi kullanmanız gerekir
    setLoading(true);
    setError(null);
    
    try {
      // Simüle edilmiş API çağrısı
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basit domain-based preview data
      const domain = extractDomain(url);
      const mockPreviewData: LinkPreviewData = {
        title: `${domain} - Link`,
        description: 'Bu link için önizleme mevcut değil.',
        domain: domain
      };
      
      setPreviewData(mockPreviewData);
    } catch (err) {
      setError('Link önizlemesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url && getMediaType(url) === 'link') {
      fetchLinkPreview(url);
    }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  const mediaType = getMediaType(url);

  const renderPreview = () => {
    if (!url) return null;

    switch (mediaType) {
      case 'image':
      case 'image/gif':
        const getImageUrl = (url: string) => {
          // Convert Giphy and Tenor URLs to direct image URLs if needed
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

        const imageUrl = getImageUrl(url);
        
        return (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-40 rounded-lg object-cover"
              onError={() => setError('Resim yüklenemedi')}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Image className="w-3 h-3" />
              {mediaType === 'image/gif' ? 'GIF' : 'Resim'}
            </div>
          </div>
        );

      case 'video':
        // Special handling for YouTube videos
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const getYouTubeVideoId = (url: string) => {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            return match ? match[1] : null;
          };

          const videoId = getYouTubeVideoId(url);
          if (videoId) {
            return (
              <div className="relative">
                <div className="aspect-video max-w-full max-h-60 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  ▶️ YouTube
                </div>
              </div>
            );
          }
        }

        // Default video handling
        return (
          <div className="relative">
            <video
              src={url}
              className="max-w-full max-h-40 rounded-lg"
              controls
              preload="metadata"
              onError={() => setError('Video yüklenemedi')}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Video className="w-3 h-3" />
              Video
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🎵</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Ses Dosyası</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{url}</p>
              </div>
            </div>
            <audio
              src={url}
              controls
              className="w-full"
              onError={() => setError('Ses dosyası yüklenemedi')}
            />
          </div>
        );

      case 'link':
        return (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader className="w-4 h-4 animate-spin" />
                Link önizlemesi yükleniyor...
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {previewData && !loading && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Link className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {previewData.title || 'Link'}
                    </h4>
                    {previewData.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {previewData.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {previewData.domain}
                    </p>
                  </div>
                </div>
                
                {previewData.image && (
                  <img
                    src={previewData.image}
                    alt="Link preview"
                    className="w-full max-h-32 object-cover rounded-lg"
                    onError={() => setError('Önizleme resmi yüklenemedi')}
                  />
                )}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all flex items-center gap-1"
              >
                {url}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Dosya</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{url}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (error && mediaType !== 'link') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 break-all">{url}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {renderPreview()}
      
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-opacity"
        title="Medyayı kaldır"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default MediaPreview;