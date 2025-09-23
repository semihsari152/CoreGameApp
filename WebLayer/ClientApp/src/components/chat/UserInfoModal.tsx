import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MessageSquare, UserMinus, UserPlus, Shield, Flag, ExternalLink } from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import { friendService } from '../../services/friendService';
import reportService, { ReportableType, ReportType } from '../../services/reportService';
import { Conversation } from '../../types/messaging';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ReportModal from '../common/ReportModal';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({
  isOpen,
  onClose,
  conversationId
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [loadingFriendship, setLoadingFriendship] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get the other user in the conversation
  const otherUser = conversation?.participants?.find(p => p.id !== user?.id);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadUserInfo();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    if (otherUser) {
      loadFriendshipStatus();
    }
  }, [otherUser]);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const data = await conversationService.getConversation(conversationId, 0, 10);
      setConversation(data);
    } catch (error) {
      console.error('Error loading user info:', error);
      toast.error('Kullanıcı bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!otherUser) return;
    
    try {
      const status = await friendService.getFriendshipStatus(otherUser.id);
      setFriendshipStatus(status.status);
      setIsUserBlocked(status.isBlocked || false);
    } catch (error) {
      console.error('Error loading friendship status:', error);
    }
  };

  const handleViewProfile = () => {
    if (otherUser) {
      navigate(`/profile/${otherUser.username}`);
      onClose();
    }
  };


  const handleFriendAction = async () => {
    if (!otherUser) return;

    try {
      setLoadingFriendship(true);
      
      if (friendshipStatus === 'friends') {
        // Remove friend
        await friendService.removeFriend(otherUser.id);
        toast.success('Arkadaşlıktan çıkarıldı');
        setFriendshipStatus('none');
      } else if (friendshipStatus === 'none') {
        // Add friend
        await friendService.sendFriendRequest(otherUser.id);
        toast.success('Arkadaşlık isteği gönderildi');
        setFriendshipStatus('pending_sent');
      }
    } catch (error: any) {
      console.error('Error with friend action:', error);
      toast.error(error.response?.data?.message || 'İşlem gerçekleştirilemedi');
    } finally {
      setLoadingFriendship(false);
    }
  };

  const handleBlockUser = async () => {
    if (!otherUser) return;
    
    const userName = otherUser.firstName && otherUser.lastName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.username;
    
    if (isUserBlocked) {
      // Engeli kaldır
      if (window.confirm(`${userName} adlı kişinin engelini kaldırmak istediğinizden emin misiniz? Bu kişi size tekrar mesaj gönderebilecek.`)) {
        try {
          setIsBlocking(true);
          await friendService.unblockUser(otherUser.id);
          toast.success('Kullanıcının engeli kaldırıldı');
          setIsUserBlocked(false);
          // Friendship status'u yeniden yükle
          await loadFriendshipStatus();
        } catch (error: any) {
          console.error('Error unblocking user:', error);
          toast.error(error.response?.data?.message || 'Engel kaldırılırken hata oluştu');
        } finally {
          setIsBlocking(false);
        }
      }
    } else {
      // Engelle
      if (window.confirm(`${userName} adlı kişiyi engellemek istediğinizden emin misiniz? Bu kişi size mesaj gönderemeyecek.`)) {
        try {
          setIsBlocking(true);
          await friendService.blockUser(otherUser.id);
          toast.success('Kullanıcı engellendi');
          setIsUserBlocked(true);
          onClose();
        } catch (error: any) {
          console.error('Error blocking user:', error);
          toast.error(error.response?.data?.message || 'Kullanıcı engellenirken hata oluştu');
        } finally {
          setIsBlocking(false);
        }
      }
    }
  };

  const handleReportUser = () => {
    setShowReportModal(true);
  };

  const handleSubmitReport = async (reportType: ReportType, reason: string, description?: string) => {
    if (!otherUser) return;

    try {
      setIsReporting(true);
      await reportService.createReport({
        reportableType: ReportableType.User,
        reportableEntityId: otherUser.id,
        reportType,
        reason,
        description
      });
      toast.success('Şikayet başarıyla gönderildi');
      setShowReportModal(false);
    } catch (error: any) {
      console.error('Error reporting user:', error);
      toast.error(error.response?.data?.message || 'Şikayet gönderilirken hata oluştu');
    } finally {
      setIsReporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6" />
            Kullanıcı Bilgileri
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
            </div>
          ) : otherUser ? (
            <div className="space-y-6">
              {/* User Avatar and Basic Info */}
              <div className="text-center">
                <button
                  onClick={handleViewProfile}
                  className="hover:scale-105 transition-transform"
                >
                  {otherUser.avatarUrl ? (
                    <img
                      src={otherUser.avatarUrl}
                      alt={otherUser.username}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto border-4 border-gray-200 dark:border-gray-600';
                        placeholder.textContent = otherUser.username.charAt(0).toUpperCase();
                        e.currentTarget.parentNode?.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto border-4 border-gray-200 dark:border-gray-600">
                      {otherUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                  {otherUser.firstName && otherUser.lastName 
                    ? `${otherUser.firstName} ${otherUser.lastName}`
                    : otherUser.username
                  }
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  @{otherUser.username}
                </p>

                {otherUser.displayName && otherUser.displayName !== otherUser.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    "{otherUser.displayName}"
                  </p>
                )}
              </div>

              {/* Conversation Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Sohbet Bilgileri
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Sohbet Başlangıcı:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(conversation?.createdAt || '')}
                    </span>
                  </div>    
                </div>
              </div>

              {/* User Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                <button 
                  onClick={handleViewProfile}
                  className="w-full flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Profile Git
                </button>

                {friendshipStatus === 'friends' && (
                  <button
                    onClick={handleFriendAction}
                    disabled={loadingFriendship}
                    className="w-full flex items-center gap-2 px-4 py-3 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingFriendship ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-5 h-5" />
                        Arkadaşlıktan Çıkar
                      </>
                    )}
                  </button>
                )}

                {(friendshipStatus === 'none') && (
                  <button
                    onClick={handleFriendAction}
                    disabled={loadingFriendship}
                    className="w-full flex items-center gap-2 px-4 py-3 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingFriendship ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Arkadaş Ekle
                      </>
                    )}
                  </button>
                )}

                {friendshipStatus === 'pending_sent' && (
                  <button
                    disabled
                    className="w-full flex items-center gap-2 px-4 py-3 text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-not-allowed"
                  >
                    <UserPlus className="w-5 h-5" />
                    İstek Gönderildi
                  </button>
                )}

                {friendshipStatus === 'pending_received' && (
                  <button
                    disabled
                    className="w-full flex items-center gap-2 px-4 py-3 text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-lg cursor-not-allowed"
                  >
                    <UserPlus className="w-5 h-5" />
                    İstek Bekliyor
                  </button>
                )}

                <button
                  onClick={handleBlockUser}
                  disabled={isBlocking}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isUserBlocked 
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  {isBlocking ? (
                    <>
                      <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                        isUserBlocked ? 'border-green-500' : 'border-red-500'
                      }`}></div>
                      {isUserBlocked ? 'Engel Kaldırılıyor...' : 'Engelleniyor...'}
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      {isUserBlocked ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}
                    </>
                  )}
                </button>

                <button 
                  onClick={handleReportUser}
                  className="w-full flex items-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Flag className="w-5 h-5" />
                  Şikayet Et
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Kullanıcı bilgileri yüklenemedi</p>
            </div>
          )}
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleSubmitReport}
          isLoading={isReporting}
          targetName={otherUser?.firstName && otherUser?.lastName 
            ? `${otherUser.firstName} ${otherUser.lastName}` 
            : otherUser?.username
          }
        />
      </div>
    </div>
  );
};

export default UserInfoModal;