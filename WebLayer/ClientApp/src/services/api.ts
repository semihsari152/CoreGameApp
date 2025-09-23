import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginDto, 
  CreateUserDto,
  Game,
  User,
  Comment,
  Guide,
  ForumTopic,
  ForumCategory,
  Genre,
  Tag,
  Notification,
  NotificationType,
  NotificationPriority,
  CreateNotificationDto,
  NotificationStats,
  GameFilterDto,
  CreateCommentDto,
  CreateGuideDto,
  CreateForumTopicDto,
  Like,
  CreateLikeDto,
  LikeStats,
  LikableType,
  UserGameStatus,
  CreateUserGameStatusDto,
  UpdateUserGameStatusDto,
  GameListType,
  Favorite,
  CreateFavoriteDto,
  FavoriteType,
  Report,
  CreateReportDto,
  UpdateReportDto,
  ReportableType
} from '../types';

// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5124/api';
console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds for heavy game detail queries
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
  },
});

// Request Interceptor - Add Auth Token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle Errors and Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Check if token is expired specifically
      const isTokenExpired = error.response?.headers?.['token-expired'] === 'true' || 
                            error.response?.data?.tokenExpired === true ||
                            error.response?.data?.message?.includes('Token expired');

      if (isTokenExpired) {
        // Token expired, show message and redirect to login
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            accessToken: Cookies.get('accessToken'),
            refreshToken: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          Cookies.set('accessToken', accessToken, { expires: 1 });
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

          return api(originalRequest);
        } else {
          // No refresh token, redirect to login
          toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
          Cookies.remove('accessToken');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Sessiz hata durumları - bunlar için toast ve console log gösterme
    const silentErrorConditions = [
      // Like-related 404'ler beklenen durumdur (kullanıcı beğenmemiş)
      error.response?.status === 404 && error.config?.url?.includes('/likes/userlike/'),
      // Favorites 404'leri de sessiz olsun (kullanıcı favori eklememiş)
      error.response?.status === 404 && error.config?.url?.includes('/favorites/'),
      // UserGameStatus 404'leri de sessiz olsun (kullanıcı oyun durumu belirtmemiş)
      error.response?.status === 404 && error.config?.url?.includes('/UserGameStatus/user/'),
      // GameRatings 404'leri de sessiz olsun (kullanıcı oyunu puanlamamış)
      error.response?.status === 404 && error.config?.url?.includes('/gamerating/user/'),
      // Reports 404'leri de sessiz olsun (kullanıcı henüz rapor atmamış)
      error.response?.status === 404 && error.config?.url?.includes('/reports/user/'),
      // Herhangi bir like durumu check'i 404'ü sessiz olsun
      error.response?.status === 404 && error.config?.url?.includes('/likes/check/'),
      // Herhangi bir favorite durumu check'i 404'ü sessiz olsun  
      error.response?.status === 404 && error.config?.url?.includes('/favorites/check/'),
    ];

    const shouldShowError = !silentErrorConditions.some(condition => condition);

    // Show error message only if not in silent conditions
    if (shouldShowError) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      }
      
      // Console'a log'la sadece gerçek hatalar için (404 hariç)
      if (error.response?.status !== 404) {
        console.error('API Error:', error);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/login', data);
    return response.data.data!;
  },

  register: async (data: CreateUserDto): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/register', data);
    return response.data.data!;
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/profile');
    return response.data.data!;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/auth/profile', data);
    return response.data.data!;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  deleteAccount: async (password: string): Promise<void> => {
    await api.delete('/auth/delete-account', { data: { password } });
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', refreshToken);
  },

  sendResetCode: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { email, code, newPassword });
  },

  sendVerificationEmail: async (): Promise<void> => {
    await api.post('/auth/send-verification-email');
  },

  verifyEmailWithToken: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email-token', { token });
  },

  googleLogin: async (token: string): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/google', { token });
    return response.data.data!;
  },

  updatePrivacySettings: async (settings: { IsProfileVisible: boolean; IsActivityStatusVisible: boolean; IsGameListVisible: boolean }): Promise<void> => {
    await api.put('/auth/privacy-settings', settings);
  },
};

// Games API
export const gamesAPI = {
  getAll: async (filters?: any): Promise<{ data: Game[], totalCount: number }> => {
    const params = new URLSearchParams();
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.genreIds) filters.genreIds.forEach((id: number) => params.append('genreIds', id.toString()));
    if (filters?.platforms) filters.platforms.forEach((platform: string) => params.append('platforms', platform));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    const response: AxiosResponse<ApiResponse<{ data: Game[], totalCount: number }>> = await api.get(`/games?${params.toString()}`);
    return response.data.data!;
  },

  getById: async (id: number): Promise<Game> => {
    const response: AxiosResponse<ApiResponse<Game>> = await api.get(`/games/${id}`);
    return response.data.data!;
  },

  getBySlug: async (slug: string): Promise<Game> => {
    const response: AxiosResponse<ApiResponse<Game>> = await api.get(`/games/slug/${slug}`);
    return response.data.data!;
  },

  search: async (searchTerm: string, page: number = 1, pageSize: number = 10): Promise<{data: Game[], totalCount: number}> => {
    const response: AxiosResponse<ApiResponse<{data: Game[], totalCount: number}>> = await api.get(
      `/games/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`
    );
    return response.data.data!;
  },

  filter: async (filters: GameFilterDto): Promise<Game[]> => {
    const params = new URLSearchParams();
    if (filters.platforms) filters.platforms.forEach(p => params.append('platforms', p.toString()));
    if (filters.categoryIds) filters.categoryIds.forEach(c => params.append('categoryIds', c.toString()));
    if (filters.tagIds) filters.tagIds.forEach(t => params.append('tagIds', t.toString()));
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.maxRating) params.append('maxRating', filters.maxRating.toString());

    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/filter?${params.toString()}`);
    return response.data.data!;
  },

  getPopular: async (count: number = 10): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/popular?count=${count}`);
    return response.data.data!;
  },

  getRecent: async (count: number = 10): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/recent?count=${count}`);
    return response.data.data!;
  },

  getSimilar: async (id: number, count: number = 5): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/${id}/similar?count=${count}`);
    return response.data.data!;
  },

  getByTheme: async (themeId: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/themes/${themeId}`);
    return response.data.data!;
  },

  getByGameMode: async (gameModeId: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/game-modes/${gameModeId}`);
    return response.data.data!;
  },

  getByPlayerPerspective: async (perspectiveId: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/player-perspectives/${perspectiveId}`);
    return response.data.data!;
  },

  getByKeyword: async (keywordId: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/keywords/${keywordId}`);
    return response.data.data!;
  },

  getByPlatform: async (platformId: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/games/platforms/${platformId}`);
    return response.data.data!;
  },


  rate: async (id: number, rating: number, review?: string): Promise<void> => {
    await api.post(`/games/${id}/rate`, { rating, review });
  },

  getRating: async (id: number): Promise<{ averageRating: number }> => {
    const response: AxiosResponse<ApiResponse<{ averageRating: number }>> = await api.get(`/games/${id}/rating`);
    return response.data.data!;
  },

  getGamesBySeries: async (seriesId: number): Promise<{ series: any, games: Game[] }> => {
    const response: AxiosResponse<ApiResponse<{ series: any, games: Game[] }>> = await api.get(`/games/series/${seriesId}`);
    return response.data.data!;
  },

};

// Users API
export const usersAPI = {
  getById: async (id: number): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/users/${id}`);
    return response.data;
  },

  getByUsername: async (username: string): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/users/username/${username}`);
    return response.data;
  },

  getActive: async (): Promise<User[]> => {
    const response: AxiosResponse<User[]> = await api.get('/users/active');
    return response.data;
  },

  getTopByXP: async (count: number): Promise<User[]> => {
    const response: AxiosResponse<User[]> = await api.get(`/users/top-by-xp/${count}`);
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  getById: async (id: number): Promise<Comment> => {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.get(`/comments/${id}`);
    return response.data.data!;
  },

  getByEntity: async (commentableType: number, entityId: number): Promise<Comment[]> => {
    const response: AxiosResponse<ApiResponse<Comment[]>> = await api.get(`/comments/entity/${commentableType}/${entityId}`);
    return response.data.data!;
  },

  getByUser: async (userId: number): Promise<Comment[]> => {
    const response: AxiosResponse<ApiResponse<Comment[]>> = await api.get(`/comments/user/${userId}`);
    return response.data.data!;
  },

  getCount: async (commentableType: number, entityId: number): Promise<{ count: number }> => {
    const response: AxiosResponse<ApiResponse<{ count: number }>> = await api.get(`/comments/entity/${commentableType}/${entityId}/count`);
    return response.data.data!;
  },

  create: async (data: CreateCommentDto): Promise<Comment> => {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.post('/comments', data);
    return response.data.data!;
  },

  update: async (id: number, content: string): Promise<Comment> => {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.put(`/comments/${id}`, { content });
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },

  like: async (id: number): Promise<{ message: string; isLiked?: boolean; isDisliked?: boolean }> => {
    const response = await api.post(`/comments/${id}/like`);
    return response.data;
  },

  unlike: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}/like`);
  },

  dislike: async (id: number): Promise<{ message: string; isLiked?: boolean; isDisliked?: boolean }> => {
    const response = await api.post(`/comments/${id}/dislike`);
    return response.data;
  },

  undislike: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}/dislike`);
  },

  toggleSticky: async (id: number): Promise<{ isSticky: boolean }> => {
    const response: AxiosResponse<ApiResponse<{ isSticky: boolean }>> = await api.post(`/comments/${id}/sticky`);
    return response.data.data!;
  },

  toggleBestAnswer: async (id: number): Promise<{ isBestAnswer: boolean }> => {
    const response: AxiosResponse<ApiResponse<{ isBestAnswer: boolean }>> = await api.post(`/comments/${id}/best-answer`);
    return response.data.data!;
  },
};

// Likes API
export const likesAPI = {
  getById: async (id: number): Promise<Like> => {
    const response: AxiosResponse<ApiResponse<Like>> = await api.get(`/likes/${id}`);
    return response.data.data!;
  },

  getByEntity: async (likableType: LikableType, entityId: number): Promise<Like[]> => {
    const response: AxiosResponse<ApiResponse<Like[]>> = await api.get(`/likes/entity/${likableType}/${entityId}`);
    return response.data.data!;
  },

  getByUser: async (userId: number): Promise<Like[]> => {
    const response: AxiosResponse<ApiResponse<Like[]>> = await api.get(`/likes/user/${userId}`);
    return response.data.data!;
  },

  getUserLike: async (userId: number, likableType: LikableType, entityId: number): Promise<Like | null> => {
    // Console'u tamamen bastır bu API call için
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    try {
      // Console'u geçici olarak kapat
      console.error = () => {};
      console.log = () => {};
      console.warn = () => {};
      
      // Normal API call yap
      const response: AxiosResponse<ApiResponse<Like>> = await api.get(`/likes/userlike/${userId}/entity/${likableType}/${entityId}`);
      return response.data.data!;
    } catch (error) {
      // 404 beklenen durum - sessizce null döndür
      return null;
    } finally {
      // Console'u geri getir
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    }
  },

  getLikeCount: async (likableType: LikableType, entityId: number, isLike?: boolean): Promise<number> => {
    const params = isLike !== undefined ? `?isLike=${isLike}` : '';
    const response: AxiosResponse<ApiResponse<{ count: number }>> = await api.get(`/likes/count/${likableType}/${entityId}${params}`);
    return response.data.data?.count || 0;
  },

  getLikeStats: async (likableType: LikableType, entityId: number): Promise<LikeStats> => {
    const response: AxiosResponse<ApiResponse<LikeStats>> = await api.get(`/likes/count/${likableType}/${entityId}`);
    return response.data.data!;
  },

  hasUserLiked: async (userId: number, likableType: LikableType, entityId: number): Promise<boolean> => {
    const response: AxiosResponse<ApiResponse<boolean>> = await api.get(`/likes/check/${userId}/${likableType}/${entityId}`);
    return response.data.data!;
  },

  create: async (data: CreateLikeDto): Promise<Like> => {
    const response: AxiosResponse<ApiResponse<Like>> = await api.post('/likes', data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/likes/${id}`);
  },

  toggle: async (userId: number, likableType: LikableType, entityId: number, isLike: boolean): Promise<void> => {
    await api.post('/likes/toggle', {
      userId,
      type: likableType,
      entityId,
      isLike
    });
  }
};

// Game Rating API
export const gameRatingAPI = {
  getUserRating: async (gameId: number): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/gamerating/user/game/${gameId}`);
    return response.data.data!;
  },

  getRatingDistribution: async (gameId: number): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/gamerating/distribution/game/${gameId}`);
    return response.data.data!;
  },

  rateGame: async (gameId: number, rating: number, review?: string): Promise<void> => {
    await api.post(`/gamerating/game/${gameId}`, {
      rating,
      review
    });
  }
};

// User Game Status API
export const userGameStatusAPI = {
  getUserGameStatuses: async (userId: number): Promise<UserGameStatus[]> => {
    const response: AxiosResponse<ApiResponse<UserGameStatus[]>> = await api.get(`/UserGameStatus/user/${userId}`);
    return response.data.data!;
  },

  getGamesByStatus: async (userId: number, status: GameListType): Promise<UserGameStatus[]> => {
    const response: AxiosResponse<ApiResponse<UserGameStatus[]>> = await api.get(`/UserGameStatus/user/${userId}/status/${status}`);
    return response.data.data!;
  },

  getUserGameStatus: async (userId: number, gameId: number): Promise<UserGameStatus | null> => {
    // Console'u tamamen bastır bu API call için
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    try {
      // Console'u geçici olarak kapat
      console.error = () => {};
      console.log = () => {};
      console.warn = () => {};
      
      const response: AxiosResponse<ApiResponse<UserGameStatus>> = await api.get(`/UserGameStatus/user/${userId}/game/${gameId}`);
      return response.data.data!;
    } catch (error) {
      // 404 beklenen durum - kullanıcı oyun durumu belirtmemiş
      return null;
    } finally {
      // Console'u geri getir
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    }
  },

  createOrUpdate: async (data: CreateUserGameStatusDto): Promise<UserGameStatus> => {
    const response: AxiosResponse<ApiResponse<UserGameStatus>> = await api.post('/UserGameStatus', data);
    return response.data.data!;
  },

  update: async (gameId: number, data: UpdateUserGameStatusDto): Promise<UserGameStatus> => {
    const response: AxiosResponse<ApiResponse<UserGameStatus>> = await api.put(`/UserGameStatus/game/${gameId}`, data);
    return response.data.data!;
  },

  remove: async (gameId: number): Promise<void> => {
    await api.delete(`/UserGameStatus/game/${gameId}`);
  },

  checkUserHasGameStatus: async (gameId: number): Promise<boolean> => {
    const response: AxiosResponse<ApiResponse<boolean>> = await api.get(`/UserGameStatus/check/game/${gameId}`);
    return response.data.data!;
  },

  getMyGameStatuses: async (): Promise<UserGameStatus[]> => {
    const response: AxiosResponse<ApiResponse<UserGameStatus[]>> = await api.get('/UserGameStatus/my-games');
    return response.data.data!;
  },

  getMyGamesByStatus: async (status: GameListType): Promise<UserGameStatus[]> => {
    const response: AxiosResponse<ApiResponse<UserGameStatus[]>> = await api.get(`/UserGameStatus/my-games/${status}`);
    return response.data.data!;
  }
};

// Favorites API (for non-game entities)
export const favoritesAPI = {
  getUserFavorites: async (userId: number, favoriteType?: FavoriteType): Promise<Favorite[]> => {
    const params = favoriteType !== undefined ? `?favoriteType=${favoriteType}` : '';
    const response: AxiosResponse<ApiResponse<Favorite[]>> = await api.get(`/favorites/user/${userId}${params}`);
    return response.data.data!;
  },

  getUserFavorite: async (userId: number, favoriteType: FavoriteType, entityId: number): Promise<Favorite | null> => {
    try {
      const response: AxiosResponse<ApiResponse<Favorite>> = await api.get(`/favorites/user/${userId}/entity/${favoriteType}/${entityId}`);
      return response.data.data!;
    } catch (error) {
      return null;
    }
  },

  create: async (data: CreateFavoriteDto): Promise<Favorite> => {
    const response: AxiosResponse<ApiResponse<Favorite>> = await api.post('/favorites', data);
    return response.data.data!;
  },

  remove: async (favoriteType: FavoriteType, entityId: number): Promise<void> => {
    await api.delete(`/favorites/entity/${favoriteType}/${entityId}`);
  },

  toggle: async (data: { favoriteType: number; targetEntityId: number }): Promise<{ isFavorited: boolean; message: string }> => {
    const response: AxiosResponse<ApiResponse<{ isFavorited: boolean }>> = await api.post('/favorites/toggle', data);
    return { 
      isFavorited: response.data.data!.isFavorited, 
      message: response.data.message 
    };
  },

  getMyFavorites: async (favoriteType?: FavoriteType): Promise<Favorite[]> => {
    const params = favoriteType !== undefined ? `?favoriteType=${favoriteType}` : '';
    const response: AxiosResponse<ApiResponse<Favorite[]>> = await api.get(`/favorites/my${params}`);
    return response.data.data!;
  },

  checkIfFavorited: async (favoriteType: number, entityId: number): Promise<ApiResponse<boolean>> => {
    const response: AxiosResponse<ApiResponse<boolean>> = await api.get(`/favorites/check/${favoriteType}/${entityId}`);
    return response.data;
  }
};

// Genres API
export const genresAPI = {
  getAll: async (): Promise<Genre[]> => {
    const response: AxiosResponse<ApiResponse<Genre[]>> = await api.get('/genres');
    return response.data.data!;
  },

  getById: async (id: number): Promise<Genre> => {
    const response: AxiosResponse<ApiResponse<Genre>> = await api.get(`/genres/${id}`);
    return response.data.data!;
  },

  getGames: async (id: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/genres/${id}/games`);
    return response.data.data!;
  },
};

// Tags API
export const tagsAPI = {
  getAll: async (): Promise<Tag[]> => {
    const response: AxiosResponse<ApiResponse<Tag[]>> = await api.get('/tags');
    return response.data.data!;
  },

  getById: async (id: number): Promise<Tag> => {
    const response: AxiosResponse<ApiResponse<Tag>> = await api.get(`/tags/${id}`);
    return response.data.data!;
  },

  getGames: async (id: number): Promise<Game[]> => {
    const response: AxiosResponse<ApiResponse<Game[]>> = await api.get(`/tags/${id}/games`);
    return response.data.data!;
  },
};

// Platforms API
export const platformsAPI = {
  getAll: async (): Promise<Array<{ id: number; name: string; description?: string; createdDate: string }>> => {
    const response: AxiosResponse<{ message: string; data: Array<{ id: number; name: string; description?: string; createdDate: string }> }> = await api.get('/platforms');
    return response.data.data!;
  },

  getById: async (id: number): Promise<{ id: number; name: string; description?: string; createdDate: string }> => {
    const response: AxiosResponse<{ message: string; data: { id: number; name: string; description?: string; createdDate: string } }> = await api.get(`/platforms/${id}`);
    return response.data.data!;
  },
};

// Themes API
export const themesAPI = {
  getAll: async (): Promise<Array<{ id: number; name: string; description?: string; createdDate: string }>> => {
    const response: AxiosResponse<{ message: string; data: Array<{ id: number; name: string; description?: string; createdDate: string }> }> = await api.get('/themes');
    return response.data.data!;
  },

  getById: async (id: number): Promise<{ id: number; name: string; description?: string; createdDate: string }> => {
    const response: AxiosResponse<{ message: string; data: { id: number; name: string; description?: string; createdDate: string } }> = await api.get(`/themes/${id}`);
    return response.data.data!;
  },
};

// Game Modes API
export const gameModesAPI = {
  getAll: async (): Promise<Array<{ id: number; name: string; description?: string; createdDate: string }>> => {
    const response: AxiosResponse<{ message: string; data: Array<{ id: number; name: string; description?: string; createdDate: string }> }> = await api.get('/gamemodes');
    return response.data.data!;
  },

  getById: async (id: number): Promise<{ id: number; name: string; description?: string; createdDate: string }> => {
    const response: AxiosResponse<{ message: string; data: { id: number; name: string; description?: string; createdDate: string } }> = await api.get(`/gamemodes/${id}`);
    return response.data.data!;
  },
};

// Keywords API  
export const keywordsAPI = {
  getAll: async (): Promise<Array<{ id: number; name: string; description?: string; createdDate: string }>> => {
    const response: AxiosResponse<{ message: string; data: Array<{ id: number; name: string; description?: string; createdDate: string }> }> = await api.get('/keywords');
    return response.data.data!;
  },

  getById: async (id: number): Promise<{ id: number; name: string; description?: string; createdDate: string }> => {
    const response: AxiosResponse<{ message: string; data: { id: number; name: string; description?: string; createdDate: string } }> = await api.get(`/keywords/${id}`);
    return response.data.data!;
  },
};

// Forum API
export const forumAPI = {
  getCategories: async (): Promise<ForumCategory[]> => {
    const response: AxiosResponse<ApiResponse<ForumCategory[]>> = await api.get('/forum/categories');
    return response.data.data!;
  },

  getTopicsByCategory: async (categoryId: number, page: number = 1, pageSize: number = 20): Promise<ForumTopic[]> => {
    const response: AxiosResponse<ApiResponse<ForumTopic[]>> = await api.get(`/forum/categories/${categoryId}/topics?page=${page}&pageSize=${pageSize}`);
    return response.data.data!;
  },

  getTopicById: async (id: number): Promise<ForumTopic> => {
    const response: AxiosResponse<ApiResponse<ForumTopic>> = await api.get(`/forum/topics/${id}`);
    return response.data.data!;
  },

  getTopicBySlug: async (slug: string): Promise<ForumTopic> => {
    const response: AxiosResponse<ApiResponse<ForumTopic>> = await api.get(`/forum/topics/slug/${slug}`);
    return response.data.data!;
  },

  createTopic: async (data: CreateForumTopicDto): Promise<ForumTopic> => {
    const response: AxiosResponse<ApiResponse<ForumTopic>> = await api.post('/forum/topics', data);
    return response.data.data!;
  },

  updateTopic: async (id: number, data: Partial<CreateForumTopicDto>): Promise<ForumTopic> => {
    const response: AxiosResponse<ApiResponse<ForumTopic>> = await api.put(`/forum/topics/${id}`, data);
    return response.data.data!;
  },

  deleteTopic: async (id: number): Promise<void> => {
    await api.delete(`/forum/topics/${id}`);
  },

  searchTopics: async (query: string, page: number = 1, pageSize: number = 20): Promise<ForumTopic[]> => {
    const response: AxiosResponse<ApiResponse<ForumTopic[]>> = await api.get(`/forum/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
    return response.data.data!;
  },
};

// Guides API
export const guidesAPI = {
  getAll: async (): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get('/guides');
    return response.data.data!;
  },

  getById: async (id: number): Promise<Guide> => {
    const response: AxiosResponse<ApiResponse<Guide>> = await api.get(`/guides/${id}`);
    return response.data.data!;
  },

  getBySlug: async (slug: string): Promise<Guide> => {
    const response: AxiosResponse<ApiResponse<Guide>> = await api.get(`/guides/slug/${slug}`);
    return response.data.data!;
  },

  getByGame: async (gameId: number): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get(`/guides/game/${gameId}`);
    return response.data.data!;
  },

  getByUser: async (userId: number): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get(`/guides/user/${userId}`);
    return response.data.data!;
  },

  getPublished: async (): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get('/guides/published');
    return response.data.data!;
  },

  getTopRated: async (count: number): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get(`/guides/top-rated/${count}`);
    return response.data.data!;
  },

  getRecent: async (count: number): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get(`/guides/recent/${count}`);
    return response.data.data!;
  },

  search: async (searchTerm: string): Promise<Guide[]> => {
    const response: AxiosResponse<ApiResponse<Guide[]>> = await api.get(`/guides/search?searchTerm=${encodeURIComponent(searchTerm)}`);
    return response.data.data!;
  },

  create: async (data: CreateGuideDto): Promise<Guide> => {
    const response: AxiosResponse<ApiResponse<Guide>> = await api.post('/guides', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<CreateGuideDto>): Promise<Guide> => {
    const response: AxiosResponse<ApiResponse<Guide>> = await api.put(`/guides/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/guides/${id}`);
  },

  publish: async (id: number): Promise<void> => {
    await api.post(`/guides/${id}/publish`);
  },

  unpublish: async (id: number): Promise<void> => {
    await api.post(`/guides/${id}/unpublish`);
  },

  getSimilar: async (id: number, count: number = 4): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/guides/${id}/similar?count=${count}`);
    return response.data.data!;
  },
};

// Notifications API
export const notificationsAPI = {
  getMy: async (includeRead: boolean = true): Promise<Notification[]> => {
    const response: AxiosResponse<ApiResponse<Notification[]>> = await api.get(`/notification?includeRead=${includeRead}`);
    return response.data.data!;
  },

  getUnread: async (): Promise<Notification[]> => {
    const response: AxiosResponse<ApiResponse<Notification[]>> = await api.get('/notification/unread');
    return response.data.data!;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response: AxiosResponse<ApiResponse<{ count: number }>> = await api.get('/notification/unread/count');
    return response.data.data!;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notification/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notification/read-all');
  },

  getRecent: async (count: number): Promise<Notification[]> => {
    const response: AxiosResponse<ApiResponse<Notification[]>> = await api.get(`/notification/recent/${count}`);
    return response.data.data!;
  },

  deleteOld: async (daysOld: number = 30): Promise<void> => {
    await api.delete(`/notification/old?daysOld=${daysOld}`);
  },
};

// Blog API
export const blogsAPI = {
  getAll: async (filters?: any): Promise<{ data: any[], totalCount: number }> => {
    const params = new URLSearchParams();
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.gameId) params.append('gameId', filters.gameId.toString());
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag: string) => params.append('tags', tag));
    }
    
    const response: AxiosResponse<ApiResponse<{ data: any[], totalCount: number }>> = await api.get(`/blogs?${params.toString()}`);
    return response.data.data!;
  },

  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/blogs/${id}`);
    return response.data.data!;
  },

  getBySlug: async (slug: string): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/blogs/slug/${slug}`);
    return response.data.data!;
  },

  create: async (data: any): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/blogs', data);
    return response.data.data!;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/blogs/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/blogs/${id}`);
  },

  like: async (id: number): Promise<void> => {
    await api.post(`/blogs/${id}/like`);
  },

  bookmark: async (id: number): Promise<void> => {
    await api.post(`/blogs/${id}/bookmark`);
  },

  getCategories: async (): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/blogs/categories');
    return response.data.data!;
  }
};

// Reports API
export const reportsAPI = {
  getAll: async (filters?: any): Promise<{ data: Report[], totalCount: number }> => {
    const params = new URLSearchParams();
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reportType) params.append('reportType', filters.reportType);
    if (filters?.reportableType) params.append('reportableType', filters.reportableType);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    const response: AxiosResponse<ApiResponse<{ data: Report[], totalCount: number }>> = await api.get(`/reports?${params.toString()}`);
    return response.data.data!;
  },

  getById: async (id: number): Promise<Report> => {
    const response: AxiosResponse<ApiResponse<Report>> = await api.get(`/reports/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateReportDto): Promise<Report> => {
    const response: AxiosResponse<ApiResponse<Report>> = await api.post('/reports', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateReportDto): Promise<Report> => {
    const response: AxiosResponse<ApiResponse<Report>> = await api.put(`/reports/${id}`, data);
    return response.data.data!;
  },

  updateStatus: async (id: number, status: string): Promise<Report> => {
    const response: AxiosResponse<ApiResponse<Report>> = await api.put(`/reports/${id}/status`, { status });
    return response.data.data!;
  },

  getByReporter: async (userId: number): Promise<Report[]> => {
    const response: AxiosResponse<ApiResponse<Report[]>> = await api.get(`/reports/reporter/${userId}`);
    return response.data.data!;
  },

  getByEntity: async (reportableType: ReportableType, entityId: number): Promise<Report[]> => {
    const response: AxiosResponse<ApiResponse<Report[]>> = await api.get(`/reports/entity/${reportableType}/${entityId}`);
    return response.data.data!;
  },

  getMyReports: async (): Promise<Report[]> => {
    const response: AxiosResponse<ApiResponse<Report[]>> = await api.get('/reports/my');
    return response.data.data!;
  }
};

// Admin API
export const adminAPI = {
  getDashboardStats: async (): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/admin/dashboard/stats');
    return response.data.data!;
  },

  getRecentActivities: async (filters?: any): Promise<{ data: any[] }> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response: AxiosResponse<ApiResponse<{ data: any[] }>> = await api.get(`/admin/activities?${params.toString()}`);
    return response.data.data!;
  },

  getUsers: async (filters?: any): Promise<{ data: any[], totalCount: number }> => {
    const params = new URLSearchParams();
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    const response: AxiosResponse<ApiResponse<{ data: any[], totalCount: number }>> = await api.get(`/admin/users?${params.toString()}`);
    return response.data.data!;
  },

  banUser: async (userId: number, reason: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/ban`, { reason });
  },

  unbanUser: async (userId: number): Promise<void> => {
    await api.post(`/admin/users/${userId}/unban`);
  },

  updateUserRole: async (userId: number, role: string): Promise<void> => {
    await api.put(`/admin/users/${userId}/role`, { role });
  }
};

// Update existing APIs
export const gamesAPIExtended = {
  ...gamesAPI,
  rate: async (id: number, rating: number): Promise<void> => {
    await api.post(`/games/${id}/rate`, { rating });
  }
};

export const commentsAPIExtended = {
  ...commentsAPI,
  getByEntityId: async (entityType: string, entityId: number): Promise<{ data: Comment[] }> => {
    const response: AxiosResponse<ApiResponse<{ data: Comment[] }>> = await api.get(`/comments/entity/${entityType}/${entityId}`);
    return response.data.data!;
  },

  create: async (data: { entityType: string, entityId: number, content: string }): Promise<Comment> => {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.post('/comments', data);
    return response.data.data!;
  }
};

export const forumAPIExtended = {
  ...forumAPI,
  getCategories: async (): Promise<{ data: ForumCategory[] }> => {
    const response: AxiosResponse<ApiResponse<{ data: ForumCategory[] }>> = await api.get('/forum/categories');
    return response.data.data!;
  },

  getTopics: async (filters?: any): Promise<{ data: ForumTopic[] }> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.gameId) params.append('gameId', filters.gameId.toString());
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    // Tags parametresi - debug için
    if (filters?.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      console.log('Sending tags:', filters.tags);
      filters.tags.forEach((tag: string) => {
        params.append('tags', tag);
      });
    }
    
    const response: AxiosResponse<ApiResponse<{ data: ForumTopic[] }>> = await api.get(`/forum/topics?${params.toString()}`);
    return response.data.data!;
  }
};

export const guidesAPIExtended = {
  ...guidesAPI,
  getAll: async (filters?: any): Promise<{ data: Guide[], totalCount: number }> => {
    const params = new URLSearchParams();
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.gameId) params.append('gameId', filters.gameId.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    const response: AxiosResponse<{message: string, data: Guide[], totalCount: number}> = await api.get(`/guides?${params.toString()}`);
    return { data: response.data.data, totalCount: response.data.totalCount || 0 };
  }
};

export const notificationsAPIExtended = {
  ...notificationsAPI,
  
  // Get user notifications with pagination
  getAll: async (filters?: { filter?: string, page?: number, pageSize?: number }): Promise<{ data: Notification[] }> => {
    const params = new URLSearchParams();
    if (filters?.filter) params.append('filter', filters.filter);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    
    const response: AxiosResponse<ApiResponse<Notification[]>> = await api.get(`/notifications?${params.toString()}`);
    return { data: response.data.data || [] };
  },

  // Get unread notifications
  getUnread: async (): Promise<Notification[]> => {
    const response: AxiosResponse<Notification[]> = await api.get('/notification/unread');
    return response.data || [];
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response: AxiosResponse<number> = await api.get('/notification/unread-count');
    return response.data || 0;
  },

  // Mark single notification as read
  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notification/${id}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notification/read-all');
  },

  // Archive notification
  archive: async (id: number): Promise<void> => {
    await api.post(`/notification/${id}/archive`);
  },

  // Delete notification
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notification/${id}`);
  },

  // Get recent notifications
  getRecent: async (count: number = 10): Promise<Notification[]> => {
    const response: AxiosResponse<Notification[]> = await api.get(`/notification/recent/${count}`);
    return response.data || [];
  },

  // Get notification stats
  getStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await api.get('/notification/stats');
    return response.data;
  }
};

export const usersAPIExtended = {
  ...usersAPI,
  addToFavorites: async (gameId: number): Promise<void> => {
    await api.post(`/users/favorites/${gameId}`);
  },

  updateProfile: async (data: any): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/users/profile', data);
    return response.data.data!;
  },

  getStats: async (userId: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/users/${userId}/stats`);
    return response.data;
  },

  getGameRatings: async (userId: number): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/users/${userId}/game-ratings`);
    return response.data.data!;
  },

  getActivity: async (userId: number): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/users/${userId}/activity`);
    return response.data.data!;
  },

  getForumPosts: async (userId: number): Promise<any[]> => {
    const response: AxiosResponse<any[]> = await api.get(`/users/${userId}/forum-posts`);
    return response.data;
  },

  getBlogs: async (userId: number): Promise<any[]> => {
    const response: AxiosResponse<any[]> = await api.get(`/users/${userId}/blogs`);
    return response.data;
  },

  getGuides: async (userId: number): Promise<any[]> => {
    const response: AxiosResponse<any[]> = await api.get(`/users/${userId}/guides`);
    return response.data;
  },

  getGameStatuses: async (userId: number): Promise<any[]> => {
    const response: AxiosResponse<any[]> = await api.get(`/users/${userId}/game-statuses`);
    return response.data;
  }
};

// Consolidated API object for easier access
// Statistics API
export const statisticsAPI = {
  // Get like/dislike counts for any entity
  getLikeCounts: async (likableType: LikableType, entityId: number): Promise<{ likeCount: number, dislikeCount: number }> => {
    try {
      const response: AxiosResponse<ApiResponse<{ likeCount: number, dislikeCount: number }>> = await api.get(`/statistics/likes/${likableType}/${entityId}`);
      return response.data.data!;
    } catch (error) {
      console.warn('Failed to fetch like counts:', error);
      return { likeCount: 0, dislikeCount: 0 };
    }
  },

  // Get comment count for any entity
  getCommentCount: async (commentableType: number, entityId: number): Promise<number> => {
    try {
      const response: AxiosResponse<ApiResponse<{ count: number }>> = await api.get(`/statistics/comments/${commentableType}/${entityId}`);
      return response.data.data?.count || 0;
    } catch (error) {
      console.warn('Failed to fetch comment count:', error);
      return 0;
    }
  },

  // Get all statistics for an entity (likes + comments)
  getEntityStats: async (likableType: LikableType, commentableType: number, entityId: number): Promise<{ likeCount: number, dislikeCount: number, commentCount: number }> => {
    try {
      const response: AxiosResponse<ApiResponse<{ likeCount: number, dislikeCount: number, commentCount: number }>> = await api.get(`/statistics/entity/${likableType}/${commentableType}/${entityId}`);
      return response.data.data!;
    } catch (error) {
      console.warn('Failed to fetch entity stats:', error);
      return { likeCount: 0, dislikeCount: 0, commentCount: 0 };
    }
  },

  // Batch get statistics for multiple entities
  getBatchStats: async (requests: Array<{ likableType: LikableType, commentableType: number, entityId: number }>): Promise<Record<number, { likeCount: number, dislikeCount: number, commentCount: number }>> => {
    try {
      const response: AxiosResponse<ApiResponse<Record<number, { likeCount: number, dislikeCount: number, commentCount: number }>>> = await api.post('/statistics/batch', { requests });
      return response.data.data!;
    } catch (error) {
      console.warn('Failed to fetch batch stats:', error);
      return {};
    }
  }
};

// Game Series API
export const gameSeriesAPI = {
  getAll: async (): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/gameseries');
    return response.data.data!;
  },

  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/gameseries/${id}`);
    return response.data.data!;
  },

  search: async (query: string): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/gameseries/search?query=${encodeURIComponent(query)}`);
    return response.data.data!;
  },

  create: async (data: any): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/gameseries', data);
    return response.data.data!;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/gameseries/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/gameseries/${id}`);
  },

  checkNameExists: async (name: string): Promise<{ exists: boolean }> => {
    const response: AxiosResponse<ApiResponse<{ exists: boolean }>> = await api.get(`/gameseries/check-name/${encodeURIComponent(name)}`);
    return response.data.data!;
  }
};

// Player Perspectives API
export const playerPerspectivesAPI = {
  getAll: async (): Promise<any[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/playerperspectives');
    return response.data.data!;
  },

  getById: async (id: number): Promise<any> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/playerperspectives/${id}`);
    return response.data.data!;
  }
};

export const apiService = {
  auth: authAPI,
  games: gamesAPIExtended,
  users: usersAPIExtended,
  comments: commentsAPIExtended,
  likes: likesAPI,
  gameRatings: gameRatingAPI,
  userGameStatus: userGameStatusAPI,
  favorites: favoritesAPI,
  genres: genresAPI,
  tags: tagsAPI,
  platforms: platformsAPI,
  themes: themesAPI,
  gameModes: gameModesAPI,
  keywords: keywordsAPI,
  forum: forumAPIExtended,
  guides: guidesAPIExtended,
  notifications: notificationsAPIExtended,
  blogs: blogsAPI,
  reports: reportsAPI,
  admin: adminAPI,
  statistics: statisticsAPI,
  gameSeries: gameSeriesAPI,
  playerPerspectives: playerPerspectivesAPI
};

// Export the axios instance for direct use
export { api };

export default apiService;