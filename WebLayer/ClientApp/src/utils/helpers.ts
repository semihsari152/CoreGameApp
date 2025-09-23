import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { 
  DATE_FORMAT, 
  DATETIME_FORMAT, 
  EXTERNAL_APIS,
  PLATFORM_LABELS,
  USER_ROLE_LABELS,
  NOTIFICATION_TYPE_LABELS,
  REPORT_STATUS_LABELS
} from './constants';
import { Platform, UserRole, NotificationType, ReportStatus } from '../types';

// Date Utilities
export const formatDate = (date: string | Date, formatStr: string = DATE_FORMAT): string => {
  try {
    if (typeof date === 'string') {
      return format(parseISO(date), formatStr);
    }
    return format(date, formatStr);
  } catch (error) {
    return 'Geçersiz tarih';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, DATETIME_FORMAT);
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    if (typeof date === 'string') {
      return formatDistanceToNow(parseISO(date), { addSuffix: true });
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Bilinmeyen zaman';
  }
};

// String Utilities
export const truncate = (str: string, length: number = 100): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const slugify = (text: string): string => {
  const turkishChars: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
  };
  
  return text
    .split('')
    .map(char => turkishChars[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeWords = (str: string): string => {
  return str.split(' ').map(capitalize).join(' ');
};

// Number Utilities
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR').format(num);
};

export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR', { 
    notation: 'compact',
    maximumFractionDigits: 1 
  }).format(num);
};

export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

// Validation Utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;
  
  const labels = ['Çok Zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü', 'Çok Güçlü'];
  const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500', 'text-green-600'];
  
  return {
    score,
    label: labels[score] || 'Çok Zayıf',
    color: colors[score] || 'text-red-500'
  };
};

// Image Utilities
export const getGameCoverUrl = (coverImageId: string | null | undefined, size: 'thumb' | 'small' | 'big' | 'original' = 'big'): string => {
  if (!coverImageId) return EXTERNAL_APIS.PLACEHOLDER_IMAGE;
  
  const sizeMap = {
    thumb: 't_thumb',
    small: 't_cover_small',
    big: 't_cover_big',
    original: 't_original'
  };
  
  return `${EXTERNAL_APIS.IGDB_IMAGE_BASE}${sizeMap[size]}/${coverImageId}.jpg`;
};

export const getAvatarUrl = (avatarUrl: string | null | undefined, fallback?: string): string => {
  return avatarUrl || fallback || `https://ui-avatars.com/api/?name=${fallback || 'User'}&background=3b82f6&color=fff`;
};

// Array Utilities
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = key(item);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Rating Utilities
export const renderStars = (rating: number, maxRating: number = 5): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-500';
  if (rating >= 3.5) return 'text-blue-500';
  if (rating >= 2.5) return 'text-yellow-500';
  if (rating >= 1.5) return 'text-orange-500';
  return 'text-red-500';
};

// Color Utilities
export const getRandomColor = (): string => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Enum Label Utilities
export const getPlatformLabel = (platform: Platform): string => {
  return PLATFORM_LABELS[platform] || 'Bilinmeyen Platform';
};

export const getUserRoleLabel = (role: UserRole): string => {
  return USER_ROLE_LABELS[role] || 'Bilinmeyen Rol';
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  return NOTIFICATION_TYPE_LABELS[type] || 'Bilinmeyen Tip';
};

export const getReportStatusLabel = (status: ReportStatus): string => {
  return REPORT_STATUS_LABELS[status] || 'Bilinmeyen Durum';
};

// URL Utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  return searchParams.toString();
};

export const parseQueryString = (queryString: string): Record<string, string | string[]> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};
  
  for (const [key, value] of params.entries()) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        (result[key] as string[]).push(value);
      } else {
        result[key] = [result[key] as string, value];
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

// Debounce Utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local Storage Utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
  }
};

// Copy to Clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Copy to clipboard failed:', fallbackError);
      return false;
    }
  }
};

// CSS Class Utilities
export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes
    .filter((cls): cls is string => Boolean(cls) && typeof cls === 'string')
    .join(' ');
};

// User Display Utilities
export const getDisplayUsername = (username: string, isActive: boolean): string => {
  return isActive ? username : 'Silinmiş Hesap';
};

export const getDisplayUserAvatar = (avatarUrl: string | null | undefined, isActive: boolean): string => {
  if (!isActive) {
    return `https://ui-avatars.com/api/?name=Silinmiş+Hesap&background=6b7280&color=fff`;
  }
  return getAvatarUrl(avatarUrl);
};

export const getUserProfileLink = (username: string, isActive: boolean): string => {
  return isActive ? `/profile/${username}` : '#';
};

export const isUserDeleted = (isActive?: boolean): boolean => {
  return isActive === false;
};