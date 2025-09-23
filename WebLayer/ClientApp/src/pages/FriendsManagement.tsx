import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  UserX, 
  Search, 
  Send, 
  Check, 
  X, 
  Clock,
  MessageCircle,
  MoreHorizontal,
  Filter,
  Settings,
  Shield,
  Heart,
  Star,
  Ban,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { friendshipService, friendshipAPI } from '../services/friendshipService';
import { formatLastSeen, formatRelativeTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface Friend {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  isOnline: boolean;
  lastActiveAt?: string;
  friendshipStatus: 'accepted' | 'pending' | 'sent' | 'none' | 'blocked';
  mutualFriends?: number;
  joinedDate?: string;
}

interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  sender: Friend;
  receiver: Friend;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const FriendsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent' | 'blocked' | 'find'>('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => void;
    actionText: string;
    isDestructive: boolean;
  } | null>(null);
  
  // Clear search when switching tabs
  const handleTabChange = (newTab: 'friends' | 'requests' | 'sent' | 'blocked' | 'find') => {
    setActiveTab(newTab);
    setSearchTerm(''); // Clear regular search input
    setFindSearchTerm(''); // Clear find friends search
    setSearchResults([]); // Clear search results
  };

  // Search handler for regular search (not find friends)
  const handleSearch = () => {
    if (activeTab === 'find') {
      handleFindFriends();
    }
  };
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  // Fetch friends data
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendshipService.getFriends()
  });

  // Fetch pending requests (received)
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['friend-requests', 'pending'],
    queryFn: () => friendshipService.getPendingRequests()
  });

  // Fetch sent requests
  const { data: sentRequests = [], isLoading: sentLoading } = useQuery({
    queryKey: ['friend-requests', 'sent'],
    queryFn: () => friendshipService.getSentRequests()
  });

  // Fetch blocked users - always query regardless of active tab
  const { data: blockedUsers = [], isLoading: blockedLoading } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => friendshipService.getBlockedUsers(),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Search users - separate state for find friends
  const [findSearchTerm, setFindSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Manual search function for find friends
  const handleFindFriends = async () => {
    if (!findSearchTerm.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await friendshipAPI.searchUsers(findSearchTerm);
      // Filter out existing friends
      const friendIds = friends.map((f: any) => f.id);
      const nonFriendResults = results.filter((user: any) => !friendIds.includes(user.id));
      setSearchResults(nonFriendResults);
    } catch (error) {
      toast.error('Arama başarısız');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: (userId: number) => friendshipService.sendFriendRequest(userId),
    onSuccess: () => {
      toast.success('Arkadaşlık isteği gönderildi');
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      // Refresh search results after sending request
      if (findSearchTerm.trim()) {
        handleFindFriends();
      }
    },
    onError: () => toast.error('İstek gönderilemedi')
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => friendshipService.acceptFriendRequest(requestId),
    onSuccess: () => {
      toast.success('Arkadaşlık isteği kabul edildi');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
    onError: () => toast.error('İstek kabul edilemedi')
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: number) => friendshipService.rejectFriendRequest(requestId),
    onSuccess: () => {
      toast.success('Arkadaşlık isteği reddedildi');
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
    onError: () => toast.error('İstek reddedilemedi')
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: number) => friendshipService.cancelFriendRequest(requestId),
    onSuccess: () => {
      toast.success('Arkadaşlık isteği geri çekildi');
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['users-search'] });
    },
    onError: () => toast.error('İstek geri çekilemedi')
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: number) => friendshipService.removeFriend(friendId),
    onSuccess: () => {
      toast.success('Arkadaş listesinden çıkarıldı');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => toast.error('Arkadaş çıkarılamadı')
  });

  const blockUserMutation = useMutation({
    mutationFn: (userId: number) => friendshipService.blockUser(userId),
    onSuccess: () => {
      toast.success('Kullanıcı engellendi');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
    onError: () => toast.error('Kullanıcı engellenemedi')
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId: number) => friendshipService.unblockUser(userId),
    onSuccess: () => {
      toast.success('Kullanıcının engeli kaldırıldı');
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
    onError: () => toast.error('Engel kaldırılamadı')
  });

  // Show confirmation modal
  const showConfirmation = (title: string, message: string, action: () => void, actionText: string, isDestructive: boolean = true) => {
    setConfirmAction({ title, message, action, actionText, isDestructive });
    setShowConfirmModal(true);
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction.action();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Confirmation actions
  const confirmRemoveFriend = (friend: Friend) => {
    showConfirmation(
      'Arkadaşı Çıkar',
      `${friend.firstName || friend.username} adlı kullanıcıyı arkadaş listesinden çıkarmak istediğinizden emin misiniz?`,
      () => removeFriendMutation.mutate(friend.id),
      'Çıkar'
    );
  };

  const confirmBlockUser = (friend: Friend) => {
    showConfirmation(
      'Kullanıcıyı Engelle',
      `${friend.firstName || friend.username} adlı kullanıcıyı engellemek istediğinizden emin misiniz? Bu işlem geri alınabilir.`,
      () => blockUserMutation.mutate(friend.id),
      'Engelle'
    );
  };

  const confirmUnblockUser = (user: Friend) => {
    showConfirmation(
      'Engeli Kaldır',
      `${user.firstName || user.username} adlı kullanıcının engelini kaldırmak istediğinizden emin misiniz?`,
      () => unblockUserMutation.mutate(user.id),
      'Engeli Kaldır',
      false
    );
  };

  const confirmCancelRequest = (request: FriendRequest) => {
    showConfirmation(
      'İsteği İptal Et',
      `${request.receiver.firstName || request.receiver.username} adlı kullanıcıya gönderilen arkadaşlık isteğini iptal etmek istediğinizden emin misiniz?`,
      () => cancelRequestMutation.mutate(request.id),
      'İptal Et'
    );
  };

  const confirmRejectRequest = (request: FriendRequest) => {
    showConfirmation(
      'İsteği Reddet',
      `${request.sender.firstName || request.sender.username} adlı kullanıcının arkadaşlık isteğini reddetmek istediğinizden emin misiniz?`,
      () => rejectRequestMutation.mutate(request.id),
      'Reddet'
    );
  };


  // Filter friends
  const filteredFriends = friends.filter((friend: Friend) => {
    const matchesSearch = friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });


  // Format request date with proper timezone
  const formatRequestDate = (request?: any) => {
    if (!request) return 'Bilinmiyor';
    
    // Try different possible date field names from backend
    const dateString = request.createdAt || request.requestedAt || request.sentAt || request.created_at || request.requested_at;
    
    if (!dateString) return 'Bilinmiyor';
    
    return formatRelativeTime(dateString);
  };

  const renderUserCard = (user: Friend, actions: React.ReactNode, subtitle?: string) => (
    <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => navigate(`/profile/${user.username}`)}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform overflow-hidden"
            >
              {user.profilePicture || (user as any).avatarUrl ? (
                <img 
                  src={user.profilePicture || (user as any).avatarUrl} 
                  alt={user.firstName || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {user.firstName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username}
              </span>
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            {user.mutualFriends && user.mutualFriends > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {user.mutualFriends} ortak arkadaş
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'friends', label: 'Arkadaşlarım', icon: Users, count: friends.length },
    { id: 'requests', label: 'İstekler', icon: Clock, count: pendingRequests.length },
    { id: 'sent', label: 'Gönderilen', icon: Send, count: sentRequests.length },
    { id: 'blocked', label: 'Engellenenler', icon: Ban, count: blockedUsers.length },
    { id: 'find', label: 'Arkadaş Bul', icon: UserPlus, count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Arkadaş Yönetimi
                </h1>
              </div>
            </div>            
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrele:</span>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'online', label: 'Çevrimiçi' },
                  { id: 'offline', label: 'Çevrimdışı' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  activeTab === 'find' 
                    ? 'Kullanıcı ara (kullanıcı adı veya isim)...' 
                    : 'Arkadaşlarınızda ara...'
                }
                value={activeTab === 'find' ? findSearchTerm : searchTerm}
                onChange={(e) => activeTab === 'find' ? setFindSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && activeTab === 'find' && handleFindFriends()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {activeTab === 'find' && (
              <button
                onClick={handleFindFriends}
                disabled={!findSearchTerm.trim() || searchLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {searchLoading ? 'Aranıyor...' : 'Bul'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <>
              {friendsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm ? 'Arkadaş bulunamadı' : 'Henüz arkadaşınız yok'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'Arama kriterlerinizle eşleşen arkadaş bulunamadı.' : 'Yeni arkadaşlar edinmek için "Arkadaş Bul" sekmesini kullanın.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredFriends.map((friend: Friend) => 
                    renderUserCard(friend, (
                      <>
                        <button
                          onClick={() => navigate(`/chat?user=${friend.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Mesaj gönder"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmRemoveFriend(friend)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Arkadaşlıktan çıkar"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmBlockUser(friend)}
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Engelle"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* Friend Requests Tab */}
          {activeTab === 'requests' && (
            <>
              {requestsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Bekleyen istek yok
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Şu anda size gönderilen arkadaşlık isteği bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map((request: FriendRequest) => 
                    renderUserCard(request.sender, (
                      <>
                        <button
                          onClick={() => acceptRequestMutation.mutate(request.id)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Kabul et"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmRejectRequest(request)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Reddet"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ), `${formatRequestDate(request)} tarihinde istek gönderdi`)
                  )}
                </div>
              )}
            </>
          )}

          {/* Sent Requests Tab */}
          {activeTab === 'sent' && (
            <>
              {sentLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Gönderilen istek yok
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Henüz kimseye arkadaşlık isteği göndermediniz.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sentRequests.map((request: FriendRequest) => 
                    renderUserCard(request.receiver, (
                      <button
                        onClick={() => confirmCancelRequest(request)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="İsteği geri çek"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ), `${formatRequestDate(request)} tarihinde istek gönderildi`)
                  )}
                </div>
              )}
            </>
          )}

          {/* Blocked Users Tab */}
          {activeTab === 'blocked' && (
            <>
              {blockedLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Engellenmiş kullanıcı yok
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Henüz hiç kullanıcı engellemediniz.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {blockedUsers.map((user: Friend) => 
                    renderUserCard(user, (
                      <button
                        onClick={() => confirmUnblockUser(user)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Engeli kaldır"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ), "Engellenmiş kullanıcı")
                  )}
                </div>
              )}
            </>
          )}

          {/* Find Friends Tab */}
          {activeTab === 'find' && (
            <>
              {searchResults.length === 0 && !searchLoading ? (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Yeni arkadaşlar keşfedin
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Kullanıcı adı veya isim yazarak arkadaş arayın.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {searchResults.map((user: any) => 
                    renderUserCard(user, (
                      <button
                        onClick={() => sendRequestMutation.mutate(user.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Arkadaş Ekle
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {confirmAction.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {confirmAction.message}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  confirmAction.isDestructive 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {confirmAction.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsManagement;