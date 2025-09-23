// Arkadaşlık ve Takip Sistemleri için Type'lar

export interface Friend {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastLoginAt?: string;
  level?: number;
  xp?: number;
}

export interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  receiver?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  requestedAt: string;
}

export interface FriendshipStatus {
  status: 'none' | 'pending' | 'accepted' | 'declined' | 'cancelled' | 'blocked' | 'self';
  isPending?: boolean;
  isSender?: boolean;
  canAccept?: boolean;
  canDecline?: boolean;
  canCancel?: boolean;
  isBlocked?: boolean;
  blockedBy?: number;
}

export interface FollowUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  isOnline: boolean;
  isFriend?: boolean;
  mutualFollowersCount?: number;
}

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

export interface FollowStats {
  userId: number;
  followersCount: number;
  followingCount: number;
}