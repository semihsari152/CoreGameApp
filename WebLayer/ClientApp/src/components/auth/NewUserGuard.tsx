import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NewUserGuardProps {
  children: React.ReactNode;
}

const NewUserGuard: React.FC<NewUserGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip check if loading or not authenticated
    if (isLoading || !isAuthenticated || !user) {
      return;
    }

    // Skip check if already on profile setup page or OAuth callback
    if (location.pathname === '/profile/setup' || location.pathname === '/oauth/callback') {
      return;
    }

    // Skip check for auth pages (login, register) to prevent infinite loops
    if (location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname.startsWith('/forgot-password')) {
      return;
    }

    // If user is new, redirect to profile setup
    if (user.isNewUser) {
      console.log('NewUserGuard: Redirecting new user to profile setup');
      navigate('/profile/setup', { 
        replace: true, 
        state: { isOAuthUser: true, from: location.pathname } 
      });
    }
  }, [user, isAuthenticated, isLoading, location.pathname, navigate]);

  return <>{children}</>;
};

export default NewUserGuard;