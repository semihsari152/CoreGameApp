import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, ImageIcon } from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import { friendService, Friend } from '../../services/friendService';
import toast from 'react-hot-toast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: number) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated
}) => {
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImageUrl, setGroupImageUrl] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      // Reset form
      setGroupTitle('');
      setGroupDescription('');
      setGroupImageUrl('');
      setSelectedFriends([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await friendService.getFriends();
      setFriends(friendsData || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Arkadaş listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      toast.error('Grup adı gerekli');
      return;
    }

    if (selectedFriends.length === 0) {
      toast.error('En az bir arkadaş seçmelisiniz');
      return;
    }

    try {
      setIsCreating(true);
      const result = await conversationService.createGroupConversation({
        title: groupTitle.trim(),
        description: groupDescription.trim() || undefined,
        groupImageUrl: groupImageUrl.trim() || undefined,
        participantIds: selectedFriends.map(f => f.id)
      });

      toast.success('Grup sohbeti oluşturuldu!');
      onGroupCreated(result.conversationId);
      onClose();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.response?.data?.message || 'Grup oluşturulurken hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Grup Sohbeti Oluştur
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Group Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Grup Bilgileri
            </h3>
            
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grup Adı *
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Grup adını girin"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={100}
              />
            </div>

            {/* Group Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama (Opsiyonel)
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Grup hakkında kısa açıklama"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={500}
              />
            </div>

            {/* Group Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grup Fotoğrafı URL (Opsiyonel)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={groupImageUrl}
                  onChange={(e) => setGroupImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
                  title="Resim yükle"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
              {groupImageUrl && (
                <div className="mt-2">
                  <img
                    src={groupImageUrl}
                    alt="Grup önizlemesi"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Friends Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Katılımcıları Seç ({selectedFriends.length} seçildi)
            </h3>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Arkadaş ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Selected Friends */}
            {selectedFriends.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seçilen Arkadaşlar:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFriends.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.username}
                          className="w-5 h-5 rounded-full object-cover"
                          onError={(e) => {
                            // Replace with placeholder div if image fails
                            const parent = e.currentTarget.parentNode;
                            if (parent) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium';
                              placeholder.textContent = friend.username.charAt(0).toUpperCase();
                              parent.replaceChild(placeholder, e.currentTarget);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {friend.firstName && friend.lastName 
                        ? `${friend.firstName} ${friend.lastName}`
                        : friend.username
                      }
                      <button
                        onClick={() => toggleFriendSelection(friend)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Arkadaşlar yükleniyor...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz arkadaşınız yok'}
                </div>
              ) : (
                filteredFriends.map(friend => {
                  const isSelected = selectedFriends.some(f => f.id === friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleFriendSelection(friend)}
                      className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            // Replace with placeholder div if image fails
                            const parent = e.currentTarget.parentNode;
                            if (parent) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium';
                              placeholder.textContent = friend.username.charAt(0).toUpperCase();
                              parent.replaceChild(placeholder, e.currentTarget);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {friend.firstName && friend.lastName 
                            ? `${friend.firstName} ${friend.lastName}`
                            : friend.username
                          }
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{friend.username}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupTitle.trim() || selectedFriends.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Grup Oluştur
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;