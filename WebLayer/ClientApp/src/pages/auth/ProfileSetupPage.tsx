import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { User, AlertTriangle, Gamepad2, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usersAPIExtended } from '../../services/api';
import toast from 'react-hot-toast';

interface ProfileSetupFormData {
  firstName: string;
  lastName: string;
  username: string;
}

const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const state = location.state as any;
  const isOAuthUser = state?.isOAuthUser || false;
  const provider = state?.provider || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProfileSetupFormData>();

  // Redirect non-OAuth users or users who already completed setup
  useEffect(() => {
    console.log('ProfileSetupPage useEffect:', {
      isOAuthUser,
      user: user ? { id: user.id, username: user.username } : null,
      state,
      location
    });

    if (!isOAuthUser || !user) {
      console.log('Redirecting from ProfileSetupPage because:', { isOAuthUser, hasUser: !!user });
      navigate('/', { replace: true });
      return;
    }

    // Pre-fill the form with existing user data
    setValue('firstName', user.firstName || '');
    setValue('lastName', user.lastName || '');
    setValue('username', user.username || '');
  }, [isOAuthUser, user, navigate, setValue]);

  // Prevent navigation away from this page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Profilinizi tamamlamadan çıkmak istediğinizden emin misiniz?';
      return 'Profilinizi tamamlamadan çıkmak istediğinizden emin misiniz?';
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Push back to the same location to prevent going back
      window.history.pushState(null, '', window.location.pathname + window.location.search);
      toast.error('Profilinizi tamamlamadan ayrılamazsınız');
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push current state to prevent back button
    window.history.pushState(null, '', window.location.pathname + window.location.search);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Prevent context menu and some keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5, Ctrl+R (refresh)
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        toast.error('Profilinizi tamamlamadan sayfayı yenileyemezsiniz');
        return false;
      }
      
      // Prevent Ctrl+W, Ctrl+T, Ctrl+N (close tab, new tab, new window)
      if (e.ctrlKey && (e.key === 'w' || e.key === 't' || e.key === 'n')) {
        e.preventDefault();
        toast.error('Profilinizi tamamlamadan ayrılamazsınız');
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable browser refresh buttons by hiding them temporarily  
    const hideRefreshButtons = () => {
      const style = document.createElement('style');
      style.id = 'profile-setup-protection';
      style.textContent = `
        /* Hide browser refresh button and other navigation controls */
        html {
          overflow: hidden !important;
        }
        body {
          overflow: auto !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
    };

    const showRefreshButtons = () => {
      const style = document.getElementById('profile-setup-protection');
      if (style) {
        style.remove();
      }
      // Reset body styles
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    hideRefreshButtons();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      showRefreshButtons();
    };
  }, []);

  const watchedUsername = watch('username');

  const onSubmit = async (data: ProfileSetupFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Call API to update user profile
      const updatedUser = await usersAPIExtended.updateProfile({
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName
      });

      // Update local user state
      setUser(updatedUser);
      
      // Clear OAuth session flags
      sessionStorage.removeItem('oauthLoginToastShown');
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      
      toast.success('Profiliniz başarıyla oluşturuldu!');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Profile setup error:', error);
      
      // Handle specific error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Bu kullanıcı adı zaten kullanılıyor.';
        toast.error(errorMessage);
      } else {
        toast.error('Profil oluştururken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOAuthUser || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-gaming rounded-2xl flex items-center justify-center shadow-xl">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-gaming font-bold text-gray-900 dark:text-white">
          Profilinizi Tamamlayın
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {provider} ile giriş yaptınız. Lütfen profil bilgilerinizi tamamlayın.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {/* Warning about username */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Önemli Bilgi
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Kullanıcı adınızı dikkatli seçin. Daha sonra değiştirilemez! Ad ve soyad bilgileriniz ise değiştirilebilir.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ad <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('firstName', {
                    required: 'Ad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'Ad en az 2 karakter olmalıdır'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Ad en fazla 50 karakter olmalıdır'
                    }
                  })}
                  type="text"
                  className={`input pl-10 ${errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Adınız"
                />
              </div>
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Soyad <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('lastName', {
                    required: 'Soyad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'Soyad en az 2 karakter olmalıdır'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Soyad en fazla 50 karakter olmalıdır'
                    }
                  })}
                  type="text"
                  className={`input pl-10 ${errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Soyadınız"
                />
              </div>
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kullanıcı Adı <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">@</span>
                </div>
                <input
                  {...register('username', {
                    required: 'Kullanıcı adı gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Kullanıcı adı en az 3 karakter olmalıdır'
                    },
                    maxLength: {
                      value: 20,
                      message: 'Kullanıcı adı en fazla 20 karakter olmalıdır'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
                    }
                  })}
                  type="text"
                  className={`input pl-8 ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="kullanici_adi"
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
              )}
              {watchedUsername && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Profiliniz: @{watchedUsername}
                </p>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Bu bilgiler profilinizde görünecek. Ad ve soyad bilgilerinizi daha sonra ayarlardan değiştirebilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Profil oluşturuluyor...' : 'Profilimi Tamamla'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;