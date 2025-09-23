import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, User, Users, MessageSquare, Check, Clock, UserPlus } from 'lucide-react';
import { friendService } from '../../services/friendService';
import toast from 'react-hot-toast';

interface FriendSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: number) => void;
}

const FriendSearchModal: React.FC<FriendSearchModalProps> = ({
  isOpen,
  onClose,
  onStartChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  // Search users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => friendService.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 5000
  });

  const handleSendFriendRequest = async (userId: number) => {
    try {
      await friendService.sendFriendRequest(userId);
      toast.success('Arkadaş isteği gönderildi');
    } catch (error) {
      toast.error('Arkadaş isteği gönderilemedi');
    }
  };

  const handleStartChat = (userId: number) => {
    if (onStartChat) {
      onStartChat(userId);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUsers(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Arkadaş Ara
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Kullanıcı adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            En az 2 karakter girin
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : searchQuery.length >= 2 ? (
            searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((user: any) => (
                  <div
                    key={user.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendFriendRequest(user.id)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Arkadaş ekle"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        {onStartChat && (
                          <button
                            onClick={() => handleStartChat(user.id)}
                            className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                            title="Mesaj gönder"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Kullanıcı bulunamadı
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Aradığınız kriterlere uygun kullanıcı bulunamadı.
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Arkadaş Ara
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yeni arkadaşlar bulmak için kullanıcı adı yazın.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendSearchModal;