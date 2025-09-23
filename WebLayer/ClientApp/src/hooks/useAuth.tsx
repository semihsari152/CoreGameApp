import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { User, AuthResponse, LoginDto, CreateUserDto } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { chatSignalRService } from '../services/chatSignalRService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDto, rememberMe?: boolean) => Promise<void>;
  register: (data: CreateUserDto) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updatePrivacySettings: (settings: { IsProfileVisible: boolean; IsActivityStatusVisible: boolean; IsGameListVisible: boolean }) => Promise<void>;
  setToken: (token: string) => void;
  setUser: (userData: User) => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Kullanıcı değiştiğinde chatSignalRService'e bildir ve chat servisini başlat
  useEffect(() => {
    chatSignalRService.setCurrentUserId(user?.id || null);
    
    // Kullanıcı giriş yaptıysa chat service'i başlat
    if (user) {
      chatSignalRService.connect().catch(console.error);
    } else {
      chatSignalRService.disconnect().catch(console.error);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('accessToken');
      if (token) {
        const userData = await authAPI.getProfile();
        setUser(userData);
      }
    } catch (error) {
      // Token might be expired, clear cookies
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginDto, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authAPI.login(data);
      
      // Store tokens with different expiration based on remember me
      const accessTokenExpires = rememberMe ? 7 : 1; // 7 days vs 1 day
      const refreshTokenExpires = rememberMe ? 30 : 7; // 30 days vs 7 days
      
      Cookies.set('accessToken', response.accessToken, { expires: accessTokenExpires });
      Cookies.set('refreshToken', response.refreshToken, { expires: refreshTokenExpires });
      
      // Store remember me preference
      if (rememberMe) {
        Cookies.set('rememberMe', 'true', { expires: refreshTokenExpires });
      }
      
      setUser(response.user);
      toast.success('Başarıyla giriş yapıldı!');
    } catch (error: any) {
      // Let the calling component handle error messages
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: CreateUserDto) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authAPI.register(data);
      
      // Store tokens with default expiration for new registrations
      Cookies.set('accessToken', response.accessToken, { expires: 7 }); // 7 days for new users
      Cookies.set('refreshToken', response.refreshToken, { expires: 30 }); // 30 days for new users
      
      setUser(response.user);
      toast.success('Hesap başarıyla oluşturuldu!');
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear local state and cookies
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('rememberMe');
      setUser(null);
      toast.success('Başarıyla çıkış yapıldı');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profil başarıyla güncellendi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profil güncellenirken hata oluştu');
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      toast.success('Şifre başarıyla değiştirildi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Şifre değiştirilirken hata oluştu');
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      await authAPI.deleteAccount(password);
      // Clear local state and cookies after successful deletion
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('rememberMe');
      setUser(null);
      toast.success('Hesap başarıyla silindi');
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hesap silinirken hata oluştu');
      throw error;
    }
  };

  const updatePrivacySettings = async (settings: { IsProfileVisible: boolean; IsActivityStatusVisible: boolean; IsGameListVisible: boolean }) => {
    try {
      await authAPI.updatePrivacySettings(settings);
      // Update user state with new privacy settings
      if (user) {
        setUser({
          ...user,
          isProfileVisible: settings.IsProfileVisible,
          isActivityStatusVisible: settings.IsActivityStatusVisible,
          isGameListVisible: settings.IsGameListVisible
        });
      }
      toast.success('Gizlilik ayarları güncellendi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gizlilik ayarları güncellenirken hata oluştu');
      throw error;
    }
  };

  const setToken = (token: string) => {
    // Store token with default expiration (7 days for OAuth)
    Cookies.set('accessToken', token, { expires: 7 });
  };

  const setUserData = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    updatePrivacySettings,
    setToken,
    setUser: setUserData,
    updateUser: setUserData, // Alias for updateUser (local state update only)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};