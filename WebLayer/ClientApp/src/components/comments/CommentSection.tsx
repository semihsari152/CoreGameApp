import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Reply, 
  MoreHorizontal, 
  Edit3, 
  Trash2,
  Send,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Smile,
  AlertTriangle,
  X
} from 'lucide-react';
import { Comment, CommentableType, CreateCommentDto, ReportableType } from '../../types';
import { commentsAPI, api } from '../../services/api';
import LikeButton from '../common/LikeButton';
import { LikableType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import ReportButton from '../common/ReportButton';
import { getDisplayUsername, getUserProfileLink } from '../../utils/helpers';

interface CommentSectionProps {
  entityType: CommentableType;
  entityId: number;
  entityTitle?: string;
  postAuthorId?: number; // Post sahibinin ID'si
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: number, parentAuthor: string, rootCommentId?: number) => void;
  level: number;
  maxLevel?: number;
  entityType: CommentableType;
  entityId: number;
  rootCommentId?: number; // Ana yorumun ID'si
  postAuthorId?: number; // Post sahibinin ID'si
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

// Simple Emoji Picker Component
const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
    '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
    '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
    '🤭', '🤫', '🤐', '🥴', '😵', '😪', '😴', '😷', '🤒', '🤕',
    '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀',
    '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼',
    '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
    '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
    '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷',
    '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛',
    '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞',
    '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={emojiPickerRef}
      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-20 w-64 h-48 overflow-y-auto"
    >
      <div className="grid grid-cols-8 gap-1">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Evet", 
  cancelText = "Hayır", 
  onConfirm, 
  onCancel, 
  variant = 'danger' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconColor: 'text-red-500',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      icon: AlertTriangle
    },
    warning: {
      iconColor: 'text-yellow-500',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: AlertTriangle
    },
    info: {
      iconColor: 'text-blue-500',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: AlertTriangle
    }
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} mr-4`}>
            <IconComponent className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to render comment content with @mentions
const renderCommentWithMentions = (content: string) => {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);
  
  return parts.map((part, index) => {
    // If it's an odd index, it's a username after @
    if (index % 2 === 1) {
      return (
        <Link
          key={index}
          to={`/profile/${part}`}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          @{part}
        </Link>
      );
    }
    return part;
  });
};

// Comment Item Component
const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onReply, 
  level, 
  maxLevel = 1,
  entityType,
  entityId,
  rootCommentId,
  postAuthorId
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false); // Başta kapalı olsun
  const [showMenu, setShowMenu] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(5); // İlk 5 yanıt göster
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editHasSpoiler, setEditHasSpoiler] = useState(comment.hasSpoiler || false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isOwner = user?.id === comment.userId;
  const isPostAuthor = user?.id === postAuthorId;
  const replies = comment.childComments || [];
  const totalReplies = replies.length;

  const handleUpdateComments = () => {
    queryClient.invalidateQueries(['comments', entityType, entityId]);
  };

  // Edit comment mutation  
  const editCommentMutation = useMutation({
    mutationFn: (data: { content: string; hasSpoiler: boolean }) => 
      api.put(`/comments/${comment.id}`, data),
    onSuccess: () => {
      toast.success('Yorum güncellendi!');
      setIsEditing(false);
      setShowMenu(false);
      handleUpdateComments();
    },
    onError: () => {
      toast.error('Yorum güncellenirken hata oluştu');
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: () => commentsAPI.delete(comment.id),
    onSuccess: () => {
      toast.success('Yorum silindi!');
      setShowMenu(false);
      handleUpdateComments();
    },
    onError: () => {
      toast.error('Yorum silinirken hata oluştu');
    }
  });

  // Toggle sticky mutation
  const toggleStickyMutation = useMutation({
    mutationFn: () => commentsAPI.toggleSticky(comment.id),
    onSuccess: (data) => {
      toast.success(data.isSticky ? 'Yorum sabitlendi!' : 'Yorum sabitlemesi kaldırıldı!');
      setShowMenu(false);
      handleUpdateComments();
    },
    onError: () => {
      toast.error('İşlem sırasında hata oluştu');
    }
  });

  // Toggle best answer mutation
  const toggleBestAnswerMutation = useMutation({
    mutationFn: () => commentsAPI.toggleBestAnswer(comment.id),
    onSuccess: (data) => {
      toast.success(data.isBestAnswer ? 'En iyi cevap olarak işaretlendi!' : 'En iyi cevap işareti kaldırıldı!');
      setShowMenu(false);
      handleUpdateComments();
    },
    onError: () => {
      toast.error('İşlem sırasında hata oluştu');
    }
  });

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowMenu(false);
  };

  const handleToggleSticky = () => {
    toggleStickyMutation.mutate();
  };

  const handleToggleBestAnswer = () => {
    toggleBestAnswerMutation.mutate();
  };

  const confirmDelete = () => {
    deleteCommentMutation.mutate();
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && (editContent.trim() !== comment.content || editHasSpoiler !== comment.hasSpoiler)) {
      editCommentMutation.mutate({ 
        content: editContent.trim(), 
        hasSpoiler: editHasSpoiler 
      });
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setEditHasSpoiler(comment.hasSpoiler || false);
    setIsEditing(false);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
    if (!showReplies) {
      setVisibleRepliesCount(5); // Açılınca ilk 5'i göster
    }
  };

  const loadMoreReplies = () => {
    setVisibleRepliesCount(prev => prev + 5); // 5'er 5'er artır
  };

  const visibleReplies = showReplies ? replies.slice(0, visibleRepliesCount) : [];
  const hasMoreReplies = showReplies && visibleRepliesCount < totalReplies;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close menu if clicking on a modal (z-index >= 50)
      const target = event.target as HTMLElement;
      const modal = target.closest('[class*="z-[99999]"], [class*="z-50"], .fixed.inset-0');
      if (modal) {
        return; // Don't close menu if clicking on modal
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatDate = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Az önce';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} gün önce`;
    } else {
      return commentDate.toLocaleDateString('tr-TR');
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="p-4">
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          {(() => {
            const username = comment.username || comment.user?.username || comment.author?.username || '';
            const isActive = comment.user?.isActive ?? comment.author?.isActive ?? true;
            const displayUsername = getDisplayUsername(username, isActive);
            const profileLink = getUserProfileLink(username, isActive);
            const avatarUrl = comment.user?.avatarUrl || comment.author?.avatarUrl || comment.userAvatarUrl;
            
            return username ? (
              isActive ? (
                <Link 
                  to={profileLink}
                  className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayUsername}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-medium">${displayUsername.charAt(0).toUpperCase()}</span>`;
                      }}
                    />
                  ) : (
                    <span>{displayUsername.charAt(0).toUpperCase()}</span>
                  )}
                </Link>
              ) : (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayUsername}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-medium">${displayUsername.charAt(0).toUpperCase()}</span>`;
                      }}
                    />
                  ) : (
                    <span>{displayUsername.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              )
            ) : (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            );
          })()}
          
          <div className="flex-1 min-w-0">
            {/* Author and Date */}
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const username = comment.username || comment.user?.username || comment.author?.username || '';
                const isActive = comment.user?.isActive ?? comment.author?.isActive ?? true;
                const displayUsername = getDisplayUsername(username, isActive);
                const profileLink = getUserProfileLink(username, isActive);
                
                return username ? (
                  isActive ? (
                    <Link 
                      to={profileLink}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {displayUsername}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-500 dark:text-gray-400 italic">
                      {displayUsername}
                    </span>
                  )
                ) : (
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    Anonim Kullanıcı
                  </span>
                );
              })()}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdDate || comment.createdAt)}
              </span>
              {isOwner && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  Siz
                </span>
              )}
              
              {/* Status badges */}
              <div className="flex gap-1">
                {comment.isSticky && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded-full flex items-center gap-1">
                    📌 Sabitlenmiş
                  </span>
                )}
                {comment.isBestAnswer && entityType === CommentableType.ForumTopic && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800/30 dark:to-emerald-800/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 text-xs rounded-lg flex items-center gap-1.5 font-semibold shadow-sm">
                    <div className="w-4 h-4 bg-green-600 dark:bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-white dark:text-green-900 text-xs font-bold">✓</span>
                    </div>
                    En İyi Cevap
                  </div>
                )}
                {comment.hasSpoiler && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded-full flex items-center gap-1">
                    ⚠️ Spoiler
                  </span>
                )}
              </div>
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="mb-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {editContent.length}/500 karakter
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={editHasSpoiler}
                        onChange={(e) => setEditHasSpoiler(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      ⚠️ Spoiler içeriyor
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || editCommentMutation.isLoading}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                {comment.hasSpoiler ? (
                  <div className="border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                    {!showSpoiler ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          ⚠️ Bu yorum spoiler içeriyor
                        </span>
                        <button
                          onClick={() => setShowSpoiler(true)}
                          className="text-sm px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors"
                        >
                          Göster
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                          {renderCommentWithMentions(comment.content)}
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setShowSpoiler(false)}
                            className="text-sm px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors"
                          >
                            Gizle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {renderCommentWithMentions(comment.content)}
                  </div>
                )}
              </div>
            )}

            {/* Comment Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LikeButton
                  entityType={LikableType.Comment}
                  entityId={comment.id}
                  variant="default"
                  size="sm"
                  showCounts={true}
                />
                
                {/* Owner Like Indicator - YouTube Style */}
                {comment.hasOwnerLike && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                    {comment.ownerAvatarUrl ? (
                      <img 
                        src={comment.ownerAvatarUrl} 
                        alt="Post Owner"
                        className="w-4 h-4 rounded-full object-cover border border-red-300 dark:border-red-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hidden">
                      <span className="text-white text-xs">👤</span>
                    </div>
                    <span className="text-red-600 dark:text-red-400 text-xs">❤️</span>
                    <span className="text-red-700 dark:text-red-300 text-xs font-medium">Yazar beğendi</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  // YouTube benzeri: Ana yoruma yanıt ise comment.id, yanıta yanıt ise rootCommentId kullan
                  const targetParentId = level === 0 ? comment.id : (rootCommentId || comment.id);
                  const username = comment.username || comment.user?.username || comment.author?.username || '';
                  const isActive = comment.user?.isActive ?? comment.author?.isActive ?? true;
                  const displayUsername = getDisplayUsername(username, isActive);
                  onReply(comment.id, displayUsername, targetParentId);
                }}
                className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Reply className="w-4 h-4" />
                Yanıtla
              </button>

              {/* More Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[140px] z-10">
                    <ReportButton
                      entityType={ReportableType.Comment}
                      entityId={comment.id}
                      entityTitle={`${(() => {
                        const username = comment.username || comment.user?.username || comment.author?.username || '';
                        const isActive = comment.user?.isActive ?? comment.author?.isActive ?? true;
                        return getDisplayUsername(username, isActive);
                      })()} yorumu`}
                      variant="menu"
                    />
                    
                    {/* Post author controls */}
                    {isPostAuthor && (
                      <>
                        <button 
                          onClick={handleToggleSticky}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          {comment.isSticky ? '📌' : '📍'} {comment.isSticky ? 'Sabitlemeden Çıkar' : 'Sabitle'}
                        </button>
                        {entityType === CommentableType.ForumTopic && (
                          <button 
                            onClick={handleToggleBestAnswer}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            {comment.isBestAnswer ? '✓' : '✓'} {comment.isBestAnswer ? 'En İyi Cevaptan Çıkar' : 'En İyi Cevap'}
                          </button>
                        )}
                      </>
                    )}
                    
                    {isOwner && (
                      <>
                        <button 
                          onClick={handleEdit}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Düzenle
                        </button>
                        <button 
                          onClick={handleDelete}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Sil
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* YouTube benzeri yanıt gösterim sistemi */}
        {level === 0 && totalReplies > 0 && (
          <div className="mt-3">
            {/* Yanıt sayacı ve toggle butonu */}
            <button
              onClick={toggleReplies}
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showReplies ? 'Yanıtları gizle' : `${totalReplies} yanıt`}
            </button>

            {/* Yanıtları göster */}
            {showReplies && (
              <div className="mt-2">
                {visibleReplies.map((reply) => {
                  return (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onReply={onReply}
                      level={1} // Tüm yanıtlar level 1
                      maxLevel={maxLevel}
                      entityType={entityType}
                      entityId={entityId}
                      rootCommentId={comment.id} // Ana yorumun ID'sini geçir
                      postAuthorId={postAuthorId}
                    />
                  );
                })}

                {/* Daha fazla yanıt göster butonu */}
                {hasMoreReplies && (
                  <div className="ml-4 mt-2">
                    <button
                      onClick={loadMoreReplies}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Daha fazla yanıt göster ({totalReplies - visibleRepliesCount} kaldı)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Level 1+ yorumlar için normal rendering (yanıtların yanıtları) */}
        {level > 0 && replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => {
              return (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  level={1} // Hep aynı seviyede
                  maxLevel={maxLevel}
                  entityType={entityType}
                  entityId={entityId}
                  rootCommentId={rootCommentId} // Ana yorumun ID'sini geçir
                  postAuthorId={postAuthorId}
                />
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Yorumu Sil"
          message="Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          confirmText="Sil"
          cancelText="İptal"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          variant="danger"
        />

      </div>
    </div>
  );
};

// Main Comment Section Component
const CommentSection: React.FC<CommentSectionProps> = ({
  entityType,
  entityId,
  entityTitle,
  postAuthorId
}) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [newCommentHasSpoiler, setNewCommentHasSpoiler] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; author: string; rootCommentId: number } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyHasSpoiler, setReplyHasSpoiler] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId, sortBy],
    queryFn: () => commentsAPI.getByEntity(entityType, entityId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get comment count
  const { data: commentCount } = useQuery({
    queryKey: ['comments-count', entityType, entityId],
    queryFn: () => commentsAPI.getCount(entityType, entityId),
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: CreateCommentDto) => commentsAPI.create(data),
    onSuccess: () => {
      toast.success('Yorumunuz eklendi!');
      setNewComment('');
      setNewCommentHasSpoiler(false);
      setReplyingTo(null);
      setReplyText('');
      setReplyHasSpoiler(false);
      queryClient.invalidateQueries(['comments', entityType, entityId]);
      queryClient.invalidateQueries(['comments-count', entityType, entityId]);
    },
    onError: () => {
      toast.error('Yorum eklenirken bir hata oluştu');
    }
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      content: newComment.trim(),
      commentableType: entityType,
      commentableEntityId: entityId,
      hasSpoiler: newCommentHasSpoiler,
    });
  };

  const handleReply = (parentId: number, parentAuthor: string, rootCommentId?: number) => {
    if (!isAuthenticated) {
      toast.error('Yanıtlamak için giriş yapmalısınız');
      return;
    }
    setReplyingTo({ 
      id: parentId, 
      author: parentAuthor, 
      rootCommentId: rootCommentId || parentId 
    });
    // YouTube benzeri: Yanıtlanan kişinin username'ini otomatik olarak ekle
    setReplyText(`@${parentAuthor} `);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;

    // Add @username to the beginning of reply content if not already there
    const trimmedText = replyText.trim();
    const mentionTag = `@${replyingTo.author} `;
    const finalContent = trimmedText.startsWith(mentionTag) ? trimmedText : mentionTag + trimmedText;

    createCommentMutation.mutate({
      content: finalContent,
      commentableType: entityType,
      commentableEntityId: entityId,
      parentCommentId: replyingTo.rootCommentId, // YouTube benzeri: Her yanıt ana yorumun çocuğu olur
      hasSpoiler: replyHasSpoiler,
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReplyEmojiSelect = (emoji: string) => {
    setReplyText(prev => prev + emoji);
    setShowReplyEmojiPicker(false);
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdDate || b.createdAt).getTime() - new Date(a.createdDate || a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdDate || a.createdAt).getTime() - new Date(b.createdDate || b.createdAt).getTime();
      case 'popular':
        return (b.likeCount || 0) - (a.likeCount || 0);
      default:
        return 0;
    }
  });

  // Build YouTube-style comment structure: Ana yorum + tüm yanıtlar flat olarak
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];
    
    // First pass: create map of all comments with childComments array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, childComments: [] });
    });
    
    // Second pass: YouTube-style flat structure
    comments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentCommentId) {
        // Bu bir yanıt yorumu - ana yorumu bul (root comment)
        let rootComment = commentMap.get(comment.parentCommentId);
        
        // Eğer parent da bir yanıt ise, onun ana yorumunu bul
        while (rootComment && rootComment.parentCommentId) {
          rootComment = commentMap.get(rootComment.parentCommentId);
        }
        
        // Ana yorumu bulduk, yanıtı ona ekle (flat structure)
        if (rootComment) {
          rootComment.childComments = rootComment.childComments || [];
          rootComment.childComments.push(commentWithChildren);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithChildren);
      }
    });
    
    // Her ana yorumun yanıtlarını tarihe göre sırala
    rootComments.forEach(rootComment => {
      if (rootComment.childComments && rootComment.childComments.length > 0) {
        rootComment.childComments.sort((a, b) => 
          new Date(a.createdDate || a.createdAt).getTime() - new Date(b.createdDate || b.createdAt).getTime()
        );
      }
    });
    
    // Sort root comments: Sticky first, then best answers, then by sortBy preference
    rootComments.sort((a, b) => {
      // Priority 1: Sticky comments first
      if (a.isSticky && !b.isSticky) return -1;
      if (!a.isSticky && b.isSticky) return 1;
      
      // Priority 2: Best answers (only for forum topics)
      if (entityType === CommentableType.ForumTopic) {
        if (a.isBestAnswer && !b.isBestAnswer) return -1;
        if (!a.isBestAnswer && b.isBestAnswer) return 1;
      }
      
      // Priority 3: Sort by user preference
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdDate || b.createdAt).getTime() - new Date(a.createdDate || a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdDate || a.createdAt).getTime() - new Date(b.createdDate || b.createdAt).getTime();
        case 'popular':
          return (b.likeCount || 0) - (a.likeCount || 0);
        default:
          return 0;
      }
    });
    
    return rootComments;
  };

  const nestedComments = buildCommentTree(sortedComments);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Yorumlar {commentCount?.count ? `(${commentCount.count})` : ''}
          </h3>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="popular">En Popüler</option>
            </select>
          </div>
        </div>

        {/* New Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-medium">${user?.username?.charAt(0)?.toUpperCase() || ''}</span>`;
                    }}
                  />
                ) : (
                  <span>{user?.username?.charAt(0)?.toUpperCase() || <UserIcon className="w-4 h-4" />}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`${entityTitle ? `${entityTitle} hakkında` : 'Bu'} yorum yapın...`}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    maxLength={500}
                  />
                  {showEmojiPicker && (
                    <EmojiPicker 
                      onEmojiSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {newComment.length}/500 karakter
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={newCommentHasSpoiler}
                        onChange={(e) => setNewCommentHasSpoiler(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      ⚠️ Spoiler
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || createCommentMutation.isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Yorum Yap
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 mb-3">Yorum yapmak için giriş yapmalısınız</p>
            <a 
              href="/login" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Giriş Yap
            </a>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            Yorumlar yükleniyor...
          </div>
        ) : nestedComments.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">Henüz yorum yok</p>
            <p>İlk yorumu sen yap!</p>
          </div>
        ) : (
          nestedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              level={0}
              maxLevel={1}  // YouTube benzeri: Sadece 1 seviye girinti
              entityType={entityType}
              entityId={entityId}
              postAuthorId={postAuthorId}
            />
          ))
        )}
      </div>

      {/* Reply Form Modal */}
      {replyingTo && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Reply className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
              @{replyingTo.author} kullanıcısına yanıt veriyorsunuz
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmitReply} className="space-y-3">
            <div className="relative">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`@${replyingTo?.author} yanıtla...`}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
                autoFocus
              />
              {showReplyEmojiPicker && (
                <EmojiPicker 
                  onEmojiSelect={handleReplyEmojiSelect}
                  onClose={() => setShowReplyEmojiPicker(false)}
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {replyText.length}/500 karakter
                </div>
                <button
                  type="button"
                  onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm font-medium hover:text-gray-800 dark:hover:text-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!replyText.trim() || createCommentMutation.isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Yanıtla
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommentSection;