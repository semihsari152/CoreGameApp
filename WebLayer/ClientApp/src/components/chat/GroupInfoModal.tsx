import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Settings, UserMinus, UserPlus, Crown, Shield, MoreHorizontal, Flag } from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import reportService, { ReportableType, ReportType } from '../../services/reportService';
import { Conversation } from '../../types/messaging';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AddMemberModal from './AddMemberModal';
import ConfirmModal from '../common/ConfirmModal';
import ReportModal from '../common/ReportModal';
import toast from 'react-hot-toast';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  conversationId
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<number | null>(null);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [userToKick, setUserToKick] = useState<{id: number, name: string} | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [userToReport, setUserToReport] = useState<{id: number, name: string} | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && conversationId) {
      loadGroupInfo();
    }
  }, [isOpen, conversationId]);

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      const data = await conversationService.getConversation(conversationId, 0, 10);
      setConversation(data);
    } catch (error) {
      console.error('Error loading group info:', error);
      toast.error('Grup bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversation || !user) return;

    try {
      setIsLeaving(true);
      await conversationService.leaveConversation(conversationId);
      
      const isOwner = isGroupOwner();
      if (isOwner) {
        toast.success('Grup liderliği devredildi ve gruptan ayrıldınız');
      } else {
        toast.success('Gruptan ayrıldınız');
      }
      
      setShowLeaveConfirm(false);
      onClose();
      // Refresh conversation list
      window.location.reload();
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast.error(error.response?.data?.message || 'Gruptan ayrılırken hata oluştu');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleKickParticipant = async (participantId: number, participantName: string) => {
    setUserToKick({ id: participantId, name: participantName });
    setShowKickConfirm(true);
  };

  const confirmKickParticipant = async () => {
    if (!userToKick) return;

    try {
      setKickingUserId(userToKick.id);
      await conversationService.kickParticipant(conversationId, userToKick.id);
      toast.success(`${userToKick.name} gruptan atıldı`);
      
      // Refresh group info
      await loadGroupInfo();
      setShowKickConfirm(false);
      setUserToKick(null);
    } catch (error: any) {
      console.error('Error kicking participant:', error);
      toast.error(error.response?.data?.message || 'Katılımcı atılırken hata oluştu');
    } finally {
      setKickingUserId(null);
    }
  };

  const handleReportUser = (participantId: number, participantName: string) => {
    setUserToReport({ id: participantId, name: participantName });
    setShowReportModal(true);
  };

  const handleSubmitReport = async (reportType: ReportType, reason: string, description?: string) => {
    if (!userToReport) return;

    try {
      setIsReporting(true);
      await reportService.createReport({
        reportableType: ReportableType.User,
        reportableEntityId: userToReport.id,
        reportType,
        reason,
        description
      });
      toast.success('Şikayet başarıyla gönderildi');
      setShowReportModal(false);
      setUserToReport(null);
    } catch (error: any) {
      console.error('Error reporting user:', error);
      toast.error(error.response?.data?.message || 'Şikayet gönderilirken hata oluştu');
    } finally {
      setIsReporting(false);
    }
  };

  const isGroupAdmin = () => {
    return conversation?.participants?.some(p => 
      p.id === user?.id && p.role === 'admin'
    );
  };

  const isGroupOwner = () => {
    return conversation?.participants?.some(p => 
      p.id === user?.id && p.role === 'owner'
    );
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
            <Users className="w-6 h-6" />
            Grup Bilgileri
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
          ) : conversation ? (
            <div className="space-y-6">
              {/* Group Avatar and Basic Info */}
              <div className="text-center">
                {conversation.groupImageUrl ? (
                  <img
                    src={conversation.groupImageUrl}
                    alt={conversation.title}
                    className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto border-4 border-gray-200 dark:border-gray-600';
                      placeholder.textContent = (conversation.title || 'G').charAt(0).toUpperCase();
                      e.currentTarget.parentNode?.appendChild(placeholder);
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto border-4 border-gray-200 dark:border-gray-600">
                    {(conversation.title || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                  {conversation.title || 'Grup Sohbeti'}
                </h3>
                
                {conversation.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {conversation.description}
                  </p>
                )}

                <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {conversation.participants?.length || 0} üye
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(conversation.createdAt)}
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Grup Üyeleri ({conversation.participants?.length || 0})
                </h4>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {conversation.participants?.map(participant => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <button
                        onClick={() => {
                          navigate(`/profile/${participant.username}`);
                          onClose();
                        }}
                        className="hover:scale-105 transition-transform"
                      >
                        {participant.avatarUrl ? (
                          <img
                            src={participant.avatarUrl}
                            alt={participant.username}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const parent = e.currentTarget.parentNode;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium';
                                placeholder.textContent = participant.username.charAt(0).toUpperCase();
                                parent.replaceChild(placeholder, e.currentTarget);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-medium">
                            {participant.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigate(`/profile/${participant.username}`);
                              onClose();
                            }}
                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                          >
                            {participant.firstName && participant.lastName
                              ? `${participant.firstName} ${participant.lastName}`
                              : participant.username
                            }
                          </button>
                          
                          {/* Role indicators */}
                          {participant.role === 'owner' && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          {participant.role === 'admin' && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                          {participant.id === user?.id && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">(Sen)</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{participant.username}
                        </p>
                      </div>

                      {/* Action buttons for participants */}
                      {participant.id !== user?.id && (
                        <div className="flex gap-1">
                          {/* Report Button */}
                          <button
                            onClick={() => handleReportUser(
                              participant.id,
                              participant.firstName && participant.lastName 
                                ? `${participant.firstName} ${participant.lastName}`
                                : participant.username
                            )}
                            className="p-2 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                            title="Şikayet Et"
                          >
                            <Flag className="w-4 h-4" />
                          </button>

                          {/* Kick Button (only for group owner) */}
                          {isGroupOwner() && (
                            <button
                              onClick={() => handleKickParticipant(
                                participant.id,
                                participant.firstName && participant.lastName 
                                  ? `${participant.firstName} ${participant.lastName}`
                                  : participant.username
                              )}
                              disabled={kickingUserId === participant.id}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Gruptan At"
                            >
                              {kickingUserId === participant.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <UserMinus className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                {(isGroupOwner() || isGroupAdmin()) && (
                  <button 
                    onClick={() => setShowAddMember(true)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                    Üye Ekle
                  </button>
                )}

                {isGroupOwner() && (
                  <button className="w-full flex items-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                    Grup Ayarları
                  </button>
                )}

                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <UserMinus className="w-5 h-5" />
                  Gruptan Ayrıl
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Grup bilgileri yüklenemedi</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        conversationId={conversationId}
        currentParticipantIds={conversation?.participants?.map(p => p.id) || []}
      />

      {/* Leave Group Confirmation */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroup}
        title="Gruptan Ayrıl"
        message={
          isGroupOwner() 
            ? 'Grup sahibi olarak gruptan ayrılırsanız, grup liderliği başka bir üyeye devredilecektir. Eğer grupta başka üye yoksa grup dağılacaktır. Emin misiniz?'
            : 'Bu gruptan ayrılmak istediğinizden emin misiniz?'
        }
        confirmText="Gruptan Ayrıl"
        cancelText="İptal"
        variant="danger"
        loading={isLeaving}
      />

      {/* Kick Participant Confirmation */}
      <ConfirmModal
        isOpen={showKickConfirm}
        onClose={() => {
          setShowKickConfirm(false);
          setUserToKick(null);
        }}
        onConfirm={confirmKickParticipant}
        title="Üyeyi Gruptan At"
        message={`${userToKick?.name || 'Bu kişi'}yi gruptan atmak istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Gruptan At"
        cancelText="İptal"
        variant="danger"
        loading={kickingUserId === userToKick?.id}
      />

      {/* Report User Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setUserToReport(null);
        }}
        onSubmit={handleSubmitReport}
        isLoading={isReporting}
        targetName={userToReport?.name}
      />
    </div>
  );
};

export default GroupInfoModal;