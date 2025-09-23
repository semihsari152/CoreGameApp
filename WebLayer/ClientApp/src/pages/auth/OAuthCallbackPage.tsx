import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const provider = urlParams.get('provider');
      const isNewUser = urlParams.get('isNewUser') === 'True';
      
      console.log('OAuth Callback Debug:', {
        fullUrl: window.location.href,
        pathname: location.pathname,
        search: location.search,
        token: token ? `${token.substring(0, 20)}...` : null,
        provider,
        isNewUser: urlParams.get('isNewUser'),
        isNewUserBool: isNewUser
      });

      if (!token) {
        toast.error('OAuth girişi başarısız oldu');
        navigate('/login');
        return;
      }

      try {
        // Store the token
        setToken(token);
        
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload Debug:', payload);
        
        const userData = {
          id: parseInt(payload.sub || payload.userId),
          email: payload.email,
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
          username: payload.username || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.name || '',
          role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User',
          avatarUrl: payload.avatarUrl || null,
          level: parseInt(payload.level || '1'),
          xp: parseInt(payload.xp || '0'),
          bio: payload.bio || '',
          createdAt: new Date().toISOString(),
          isActive: payload.isActive === 'true' || payload.isActive === true,
          isEmailVerified: payload.isEmailVerified === 'true' || payload.isEmailVerified === true
        };
        
        console.log('User Data Created:', userData);

        setUser(userData);

        const providerName = provider === 'google' ? 'Google' : 'Discord';
        
        // Show success toast only once
        if (!sessionStorage.getItem('oauthLoginToastShown')) {
          toast.success(`${providerName} ile giriş başarılı! Hoş geldiniz.`);
          sessionStorage.setItem('oauthLoginToastShown', 'true');
        }
        
        // If this is a new user, redirect to profile setup page
        console.log('Checking redirect condition:', { isNewUser, providerName });
        
        if (isNewUser) {
          console.log('Redirecting to profile setup page...');
          setTimeout(() => {
            console.log('Actually navigating now...');
            navigate('/profile/setup', { replace: true, state: { isOAuthUser: true, provider: providerName } });
          }, 100); // Small delay to ensure state is set
          return; // Early return to prevent further execution
        } else {
          console.log('Redirecting to home page...');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Giriş işlemi sırasında bir hata oluştu');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [location.search, navigate, setToken, setUser]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-gaming rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-gaming font-bold text-gray-900 dark:text-white">
          Giriş Yapılıyor...
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Lütfen bekleyin, hesabınıza giriş yapılıyor.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;