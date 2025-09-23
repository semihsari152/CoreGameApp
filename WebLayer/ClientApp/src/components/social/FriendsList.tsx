import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  UserX, 
  MessageCircle, 
  MoreHorizontal, 
  Search,
  Shield,
  Clock
} from 'lucide-react';
import { friendshipAPI } from '../../services/friendshipService';
import { conversationService } from '../../services/conversationService';
import { Friend, FriendRequest } from '../../types/social';
import toast from 'react-hot-toast';

interface FriendsListProps {
  onStartChat?: (friendId: number) => void;
  showChatButtons?: boolean;
  compact?: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({ 
  onStartChat, 
  showChatButtons = false, 
  compact = false 
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Friends listesi
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: friendshipAPI.getFriends
  });

  // Gelen arkadaşlık istekleri
  const { data: incomingRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['friend-requests', 'incoming'],
    queryFn: friendshipAPI.getIncomingRequests
  });

  // Gönderilen arkadaşlık istekleri
  const { data: sentRequests = [], isLoading: sentLoading } = useQuery<FriendRequest[]>({
    queryKey: ['friend-requests', 'sent'],
    queryFn: friendshipAPI.getSentRequests
  });

  // Arkadaşlık isteğini kabul et
  const acceptRequestMutation = useMutation({
    mutationFn: friendshipAPI.acceptFriendRequest,
    onSuccess: () => {
      toast.success('Arkadaşlık isteği kabul edildi!');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
    onError: () => {
      toast.error('Bir hata oluştu');
    }
  });

  // Arkadaşlık isteğini reddet
  const declineRequestMutation = useMutation({
    mutationFn: friendshipAPI.declineFriendRequest,
    onSuccess: () => {
      toast.success('Arkadaşlık isteği reddedildi');
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
    onError: () => {
      toast.error('Bir hata oluştu');
    }
  });

  // Arkadaşlığı kaldır
  const removeFriendMutation = useMutation({
    mutationFn: friendshipAPI.cancelFriendRequest,
    onSuccess: () => {
      toast.success('Arkadaşlık sonlandırıldı');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => {
      toast.error('Bir hata oluştu');
    }
  });

  // Direkt mesaj başlat
  const startDirectMessageMutation = useMutation({
    mutationFn: conversationService.startDirectMessage,
    onSuccess: (data) => {
      toast.success('Mesajlaşma başlatıldı!');
      // Chat sayfasına yönlendir
      window.location.href = `/chat/${data.conversationId}`;
    },
    onError: () => {
      toast.error('Mesajlaşma başlatılamadı');
    }
  });

  // Filtrelenmiş veriler
  const filteredFriends = friends.filter((friend: Friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIncomingRequests = incomingRequests.filter((request: FriendRequest) =>
    request.sender.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${request.sender.firstName} ${request.sender.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSentRequests = sentRequests.filter((request: FriendRequest) =>
    request.receiver?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${request.receiver?.firstName} ${request.receiver?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return `${Math.floor(diffInMinutes / 1440)} gün önce`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Arkadaşlarım</h1>
            <p className="text-gray-600 dark:text-gray-400">Arkadaşlarınızı yönetin</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Arkadaş ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'friends'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Arkadaşlar ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Gelen İstekler ({incomingRequests.length})
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Gönderilen İstekler ({sentRequests.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Arkadaşlar Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friendsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'Arkadaş bulunamadı' : 'Henüz arkadaşınız yok'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Arama kriterlerinize uygun arkadaş bulunamadı.' : 'Yeni arkadaşlar eklemek için kullanıcıları arayın.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredFriends.map((friend: Friend) => (
                  <div key={friend.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                            {friend.avatarUrl ? (
                              <img 
                                src={friend.avatarUrl} 
                                alt={friend.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold">
                                {friend.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {friend.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {friend.firstName && friend.lastName 
                              ? `${friend.firstName} ${friend.lastName}` 
                              : friend.username}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{friend.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Son görülme: {friend.lastLoginAt ? formatRelativeTime(friend.lastLoginAt) : 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {showChatButtons ? (
                          <button
                            onClick={() => onStartChat?.(friend.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Sohbet Et
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => startDirectMessageMutation.mutate(friend.id)}
                              disabled={startDirectMessageMutation.isPending}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Mesaj gönder"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Bu arkadaşlığı sonlandırmak istediğinizden emin misiniz?')) {
                                  removeFriendMutation.mutate(friend.id);
                                }
                              }}
                              disabled={removeFriendMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Arkadaşlığı sonlandır"
                            >
                              <UserX className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gelen İstekler Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredIncomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'İstek bulunamadı' : 'Gelen arkadaşlık isteği yok'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Arama kriterlerinize uygun istek bulunamadı.' : 'Henüz size arkadaşlık isteği gönderilmemiş.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredIncomingRequests.map((request: FriendRequest) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center overflow-hidden">
                          {request.sender.avatarUrl ? (
                            <img 
                              src={request.sender.avatarUrl} 
                              alt={request.sender.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold">
                              {request.sender.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {request.sender.firstName && request.sender.lastName 
                              ? `${request.sender.firstName} ${request.sender.lastName}` 
                              : request.sender.username}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{request.sender.username}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(request.requestedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => acceptRequestMutation.mutate(request.id)}
                          disabled={acceptRequestMutation.isPending}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Kabul Et
                        </button>
                        <button
                          onClick={() => declineRequestMutation.mutate(request.id)}
                          disabled={declineRequestMutation.isPending}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gönderilen İstekler Tab */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredSentRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'İstek bulunamadı' : 'Gönderilen arkadaşlık isteği yok'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Arama kriterlerinize uygun istek bulunamadı.' : 'Henüz kimseye arkadaşlık isteği göndermediniz.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSentRequests.map((request: FriendRequest) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden">
                          {request.receiver?.avatarUrl ? (
                            <img 
                              src={request.receiver.avatarUrl} 
                              alt={request.receiver.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold">
                              {request.receiver?.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {request.receiver?.firstName && request.receiver.lastName 
                              ? `${request.receiver.firstName} ${request.receiver.lastName}` 
                              : request.receiver?.username}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{request.receiver?.username}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(request.requestedAt)} gönderildi
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                          Bekliyor
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsList;