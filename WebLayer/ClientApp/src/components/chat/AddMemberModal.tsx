import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { friendService, Friend } from '../../services/friendService';
import { conversationService } from '../../services/conversationService';
import toast from 'react-hot-toast';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  currentParticipantIds: number[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentParticipantIds
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      setSearchQuery('');
      setSelectedFriends([]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter friends that are not already in the group
    const availableFriends = friends.filter(friend => 
      !currentParticipantIds.includes(friend.id)
    );
    
    // Apply search filter
    const filtered = availableFriends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredFriends(filtered);
  }, [friends, currentParticipantIds, searchQuery]);

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

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      toast.error('En az bir arkadaş seçmelisiniz');
      return;
    }

    try {
      setAdding(true);
      
      // Add each selected friend to the group
      for (const friend of selectedFriends) {
        await conversationService.addParticipant(conversationId, friend.id);
      }

      const memberNames = selectedFriends.map(f => 
        f.firstName && f.lastName ? `${f.firstName} ${f.lastName}` : f.username
      ).join(', ');

      toast.success(`${selectedFriends.length} üye gruba eklendi: ${memberNames}`);
      onClose();
    } catch (error: any) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.message || 'Üyeler eklenirken hata oluştu');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Gruba Üye Ekle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                Seçilen Arkadaşlar ({selectedFriends.length}):
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
                {searchQuery ? 
                  'Arama sonucu bulunamadı' : 
                  currentParticipantIds.length >= friends.length ? 
                    'Tüm arkadaşlarınız bu grupta zaten mevcut' :
                    'Eklenebilecek arkadaş bulunamadı'
                }
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

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={adding}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            onClick={handleAddMembers}
            disabled={adding || selectedFriends.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {adding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Ekleniyor...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {selectedFriends.length > 0 ? `${selectedFriends.length} Üye Ekle` : 'Üye Ekle'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;