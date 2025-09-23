import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { friendshipAPI, FriendSuggestion, SearchResult, PopularUser } from '../../services/friendshipService';
import { UserPlus, Users, Search, TrendingUp, User, UserX, UserCheck } from 'lucide-react';

interface Friend {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastLoginAt?: string;
}

interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  requestedAt: string;
}

export const Friends: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'suggestions' | 'search' | 'requests'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [popularUsers, setPopularUsers] = useState<PopularUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadIncomingRequests();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'suggestions') {
      loadSuggestions();
      loadPopularUsers();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await friendshipAPI.getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const suggestionsData = await friendshipAPI.getSuggestions(10);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadPopularUsers = async () => {
    try {
      const popularData = await friendshipAPI.getPopularUsers(15);
      setPopularUsers(popularData);
    } catch (error) {
      console.error('Error loading popular users:', error);
    }
  };

  const loadIncomingRequests = async () => {
    try {
      const requestsData = await friendshipAPI.getIncomingRequests();
      setIncomingRequests(requestsData);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await friendshipAPI.searchUsers(query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await friendshipAPI.sendFriendRequest(userId);
      // Refresh suggestions and search results
      if (activeTab === 'suggestions') {
        loadSuggestions();
        loadPopularUsers();
      } else if (activeTab === 'search') {
        handleSearch(searchQuery);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    try {
      await friendshipAPI.acceptFriendRequest(requestId);
      loadIncomingRequests();
      loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (requestId: number) => {
    try {
      await friendshipAPI.declineFriendRequest(requestId);
      loadIncomingRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const UserCard: React.FC<{
    user: (FriendSuggestion | SearchResult | PopularUser | Friend) & { level?: number; xp?: number; mutualFriends?: number; friendCount?: number };
    showAddButton?: boolean;
    onAddFriend?: () => void;
  }> = ({ user, showAddButton = false, onAddFriend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          )}
          {'isOnline' in user && user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.username}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            @{user.username}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {user.level && user.xp && (
              <span>Level {user.level} • {user.xp} XP</span>
            )}
            {user.mutualFriends && user.mutualFriends > 0 && (
              <span>{user.level ? ' • ' : ''}{user.mutualFriends} mutual friends</span>
            )}
            {user.friendCount && (
              <span>{user.level || (user.mutualFriends != null && user.mutualFriends > 0) ? ' • ' : ''}{user.friendCount} friends</span>
            )}
          </div>
        </div>

        {showAddButton && onAddFriend && (
          <button
            onClick={onAddFriend}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            title="Send Friend Request"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const RequestCard: React.FC<{ request: FriendRequest }> = ({ request }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {request.sender.avatarUrl ? (
              <img
                src={request.sender.avatarUrl}
                alt={request.sender.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>
          
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {request.sender.firstName && request.sender.lastName 
                ? `${request.sender.firstName} ${request.sender.lastName}` 
                : request.sender.username}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{request.sender.username}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(request.requestedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => acceptFriendRequest(request.id)}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            title="Accept"
          >
            <UserCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => declineFriendRequest(request.id)}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            title="Decline"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Please log in to view friends.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Friends</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'friends' 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends ({friends.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'suggestions' 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Discover</span>
          </button>
          
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'search' 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'requests' 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Requests ({incomingRequests.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading friends...</div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">No friends yet. Start by discovering new people!</div>
            </div>
          ) : (
            friends.map(friend => (
              <UserCard key={friend.id} user={friend} />
            ))
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {/* Friend Suggestions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggested Friends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map(suggestion => (
                <UserCard 
                  key={suggestion.id} 
                  user={suggestion} 
                  showAddButton 
                  onAddFriend={() => sendFriendRequest(suggestion.id)} 
                />
              ))}
            </div>
          </div>

          {/* Popular Users */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularUsers.map(user => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  showAddButton 
                  onAddFriend={() => sendFriendRequest(user.id)} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by username or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Searching...</div>
            </div>
          ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">No users found for "{searchQuery}"</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map(result => (
                <UserCard 
                  key={result.id} 
                  user={result} 
                  showAddButton 
                  onAddFriend={() => sendFriendRequest(result.id)} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">No pending friend requests</div>
            </div>
          ) : (
            incomingRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Friends;