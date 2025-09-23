import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotifications';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import NewUserGuard from './components/auth/NewUserGuard';
import { STORAGE_KEYS, THEMES } from './utils/constants';
import { getFromStorage, setToStorage } from './utils/helpers';
import { chatSignalRService } from './services/chatSignalRService';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const GamesPage = React.lazy(() => import('./pages/GamesPage'));
const GameDetailPage = React.lazy(() => import('./pages/GameDetailPage'));
const GameSeriesPage = React.lazy(() => import('./pages/GameSeriesPage'));
const GenreGamesPage = React.lazy(() => import('./pages/GenreGamesPage'));
const ThemeGamesPage = React.lazy(() => import('./pages/ThemeGamesPage'));
const GameModeGamesPage = React.lazy(() => import('./pages/GameModeGamesPage'));
const PlayerPerspectiveGamesPage = React.lazy(() => import('./pages/PlayerPerspectiveGamesPage'));
const KeywordGamesPage = React.lazy(() => import('./pages/KeywordGamesPage'));
const PlatformGamesPage = React.lazy(() => import('./pages/PlatformGamesPage'));
const ForumPage = React.lazy(() => import('./pages/ForumPage'));
const ForumCreatePage = React.lazy(() => import('./pages/ForumCreatePage'));
const ForumTopicDetailPage = React.lazy(() => import('./pages/ForumTopicDetailPage'));
const GuidesPage = React.lazy(() => import('./pages/GuidesPage'));
const GuideCreatePage = React.lazy(() => import('./pages/GuideCreatePage'));
const GuideDetailPage = React.lazy(() => import('./pages/GuideDetailPage'));
const ProfilePage = React.lazy(() => import('./pages/auth/NewProfilePage'));
const PublicProfilePage = React.lazy(() => import('./pages/PublicProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Auth pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OAuthCallbackPage = React.lazy(() => import('./pages/auth/OAuthCallbackPage'));
const ProfileSetupPage = React.lazy(() => import('./pages/auth/ProfileSetupPage'));
const EmailVerificationPage = React.lazy(() => import('./pages/EmailVerificationPage'));

// Blog pages
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = React.lazy(() => import('./pages/BlogDetailPage'));
const BlogCreatePage = React.lazy(() => import('./pages/BlogCreatePage'));
const EditBlogPage = React.lazy(() => import('./pages/EditBlogPage'));

// Edit pages
const EditGuidePage = React.lazy(() => import('./pages/EditGuidePage'));
const EditForumTopicPage = React.lazy(() => import('./pages/EditForumTopicPage'));

// Report pages
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const CreateReportPage = React.lazy(() => import('./pages/CreateReportPage'));
const ReportDetailPage = React.lazy(() => import('./pages/ReportDetailPage'));

// Admin pages
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = React.lazy(() => import('./pages/admin/UsersManagement'));
const PermissionManagement = React.lazy(() => import('./pages/admin/PermissionManagement'));
const UserPermissionManagement = React.lazy(() => import('./pages/admin/UserPermissionManagement'));
const ContentManagement = React.lazy(() => import('./pages/admin/ContentManagement'));
const BlogManagement = React.lazy(() => import('./components/admin/content/BlogManagement'));
const GuideManagement = React.lazy(() => import('./components/admin/content/GuideManagement'));
const ForumManagement = React.lazy(() => import('./components/admin/forum/ForumManagement'));
const ReportManagement = React.lazy(() => import('./pages/admin/ReportManagement'));
const GameManagement = React.lazy(() => import('./components/admin/games/GameManagement'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));
const SystemSettings = React.lazy(() => import('./pages/admin/SystemSettings'));

// Social pages
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const FriendsManagement = React.lazy(() => import('./pages/FriendsManagement'));

// Debug pages
const TokenTestPage = React.lazy(() => import('./pages/debug/TokenTestPage'));

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Header wrapper to conditionally show header
const HeaderWrapper: React.FC<{ onThemeToggle: () => void; isDarkMode: boolean }> = ({ onThemeToggle, isDarkMode }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  // Don't show header on admin pages
  if (isAdminPage) {
    return null;
  }
  
  return <Header onThemeToggle={onThemeToggle} isDarkMode={isDarkMode} />;
};

// Location component to check current path and manage chat service
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const isAdminPage = location.pathname.startsWith('/admin');
  
  // Chat sayfası durumunu chatSignalRService'e bildir
  useEffect(() => {
    chatSignalRService.setIsOnChatPage(isChatPage);
  }, [isChatPage]);
  
  return (
    <>
      {children}
      {/* Footer - hidden on chat page and admin pages */}
      {!isChatPage && !isAdminPage && <Footer />}
    </>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = getFromStorage(STORAGE_KEYS.THEME, THEMES.SYSTEM);
    
    if (savedTheme === THEMES.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return savedTheme === THEMES.DARK;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = getFromStorage(STORAGE_KEYS.THEME, THEMES.SYSTEM);
      if (savedTheme === THEMES.SYSTEM) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? THEMES.LIGHT : THEMES.DARK;
    setIsDarkMode(!isDarkMode);
    setToStorage(STORAGE_KEYS.THEME, newTheme);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <ScrollToTop />
          <div className="h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  color: isDarkMode ? '#f9fafb' : '#374151',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />

            {/* Header - Component to conditionally render */}
            <HeaderWrapper onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />

            {/* Main Content */}
            <LayoutWrapper>
              <main className="flex-1">
                <NewUserGuard>
                  <React.Suspense
                    fallback={
                      <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                        </div>
                      </div>
                    }
                  >
                  <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/games/:slug" element={<GameDetailPage />} />
                  <Route path="/games/series/:seriesId" element={<GameSeriesPage />} />
                  <Route path="/games/genres/:id" element={<GenreGamesPage />} />
                  <Route path="/games/themes/:id" element={<ThemeGamesPage />} />
                  <Route path="/games/game-modes/:id" element={<GameModeGamesPage />} />
                  <Route path="/games/player-perspectives/:id" element={<PlayerPerspectiveGamesPage />} />
                  <Route path="/games/keywords/:id" element={<KeywordGamesPage />} />
                  <Route path="/games/platforms/:id" element={<PlatformGamesPage />} />
                  <Route path="/forum" element={<ForumPage />} />
                  <Route path="/forum/create" element={<ForumCreatePage />} />
                  <Route path="/forum/topic/:id" element={<ForumTopicDetailPage />} />
                  <Route path="/forum/:slug" element={<ForumTopicDetailPage />} />
                  <Route path="/forum/topic/edit/:id" element={<EditForumTopicPage />} />
                  <Route path="/guides" element={<GuidesPage />} />
                  <Route path="/guides/create" element={<GuideCreatePage />} />
                  <Route path="/guides/:id" element={<GuideDetailPage />} />
                  <Route path="/guide/:slug" element={<GuideDetailPage />} />
                  <Route path="/guides/edit/:id" element={<EditGuidePage />} />
                  
                  {/* Blog Routes */}
                  <Route path="/blogs" element={<BlogPage />} />
                  <Route path="/blogs/:id" element={<BlogDetailPage />} />
                  <Route path="/blog/:slug" element={<BlogDetailPage />} />
                  <Route path="/blog/create" element={<BlogCreatePage />} />
                  <Route path="/blogs/edit/:id" element={<EditBlogPage />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                  <Route path="/profile/setup" element={<ProfileSetupPage />} />
                  <Route path="/verify-email" element={<EmailVerificationPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:username" element={<PublicProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/friends" element={<FriendsManagement />} />
                  
                  {/* Debug routes */}
                  <Route path="/debug/token-test" element={<TokenTestPage />} />
                  
                  {/* Report Routes */}
                  <Route path="/reports/create" element={<CreateReportPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="permissions" element={<PermissionManagement />} />
                    <Route path="user-permissions" element={<UserPermissionManagement />} />
                    <Route path="blogs" element={<BlogManagement />} />
                    <Route path="guides" element={<GuideManagement />} />
                    <Route path="forum" element={<ForumManagement />} />
                    <Route path="reports" element={<ReportManagement />} />
                    <Route path="reports/:id" element={<ReportDetailPage />} />
                    <Route path="games" element={<GameManagement />} />
                    <Route path="audit" element={<AuditLogs />} />
                    <Route path="settings" element={<SystemSettings />} />
                  </Route>
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/reports/:id" element={<ReportDetailPage />} />
                  
                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                  </React.Suspense>
                </NewUserGuard>
              </main>
            </LayoutWrapper>
          </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;