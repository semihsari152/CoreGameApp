import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Mail, 
  Shield, 
  Globe, 
  Image, 
  Zap,
  Bell,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Clock,
  HardDrive,
  Cpu,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminAuthService } from '../../services/admin/adminAuthService';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireStrongPasswords: boolean;
    allowUserRegistration: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  content: {
    maxFileSize: number;
    allowedFileTypes: string[];
    enableContentModeration: boolean;
    autoPublish: boolean;
    commentsEnabled: boolean;
    requireCommentApproval: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    enableCompression: boolean;
    maxConcurrentUsers: number;
    databaseOptimization: boolean;
  };
  notifications: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    notificationFrequency: string;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

interface SystemStats {
  server: {
    uptime: string;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  database: {
    size: string;
    connections: number;
    queries: number;
    avgResponseTime: number;
  };
  cache: {
    hitRate: number;
    totalRequests: number;
    cacheSize: string;
    evictions: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    onlineUsers: number;
  };
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'CoreGame',
      siteDescription: 'Oyun rehberleri ve topluluk platformu',
      adminEmail: 'admin@coregame.com',
      defaultLanguage: 'tr',
      timezone: 'Europe/Istanbul',
      maintenanceMode: false,
      maintenanceMessage: 'Site bakımda. Lütfen daha sonra tekrar deneyin.'
    },
    security: {
      enableTwoFactor: true,
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      lockoutDuration: 900,
      requireStrongPasswords: true,
      allowUserRegistration: true
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      fromEmail: 'noreply@coregame.com',
      fromName: 'CoreGame',
      enableEmailNotifications: true
    },
    content: {
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
      enableContentModeration: true,
      autoPublish: false,
      commentsEnabled: true,
      requireCommentApproval: false
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 3600,
      enableCompression: true,
      maxConcurrentUsers: 1000,
      databaseOptimization: true
    },
    notifications: {
      enablePushNotifications: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      notificationFrequency: 'instant',
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00'
    }
  });

  const [systemStats, setSystemStats] = useState<SystemStats>({
    server: {
      uptime: '15 gün 8 saat',
      cpuUsage: 45,
      memoryUsage: 67,
      diskUsage: 23,
      activeConnections: 234
    },
    database: {
      size: '1.2 GB',
      connections: 15,
      queries: 12567,
      avgResponseTime: 45
    },
    cache: {
      hitRate: 85,
      totalRequests: 45234,
      cacheSize: '256 MB',
      evictions: 1234
    },
    users: {
      totalUsers: 5678,
      activeUsers: 234,
      newRegistrations: 45,
      onlineUsers: 89
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'content' | 'performance' | 'notifications' | 'system-info'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadSystemStats();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await api.get('/admin/settings');
      // setSettings(response.data);
    } catch (error: any) {
      toast.error('Ayarlar yüklenirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/admin/system/stats');
      // setSystemStats(response.data);
    } catch (error: any) {
      console.error('Sistem istatistikleri yüklenemedi:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // In a real app, this would be an API call
      // await api.put('/admin/settings', settings);
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error: any) {
      toast.error('Ayarlar kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      // await api.post('/admin/system/clear-cache');
      toast.success('Önbellek temizlendi');
    } catch (error: any) {
      toast.error('Önbellek temizlenirken hata oluştu');
    }
  };

  const handleRestartServices = async () => {
    if (!window.confirm('Servisleri yeniden başlatmak istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      // await api.post('/admin/system/restart-services');
      toast.success('Servisler yeniden başlatıldı');
    } catch (error: any) {
      toast.error('Servisler yeniden başlatılırken hata oluştu');
    }
  };

  const handleDatabaseOptimize = async () => {
    try {
      // await api.post('/admin/system/optimize-database');
      toast.success('Veritabanı optimize edildi');
    } catch (error: any) {
      toast.error('Veritabanı optimize edilirken hata oluştu');
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!AdminAuthService.canManageSystem()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Settings className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Yetkisiz Erişim
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'general', label: 'Genel', icon: <Globe className="w-4 h-4" /> },
    { key: 'security', label: 'Güvenlik', icon: <Shield className="w-4 h-4" /> },
    { key: 'email', label: 'E-posta', icon: <Mail className="w-4 h-4" /> },
    { key: 'content', label: 'İçerik', icon: <FileText className="w-4 h-4" /> },
    { key: 'performance', label: 'Performans', icon: <Zap className="w-4 h-4" /> },
    { key: 'notifications', label: 'Bildirimler', icon: <Bell className="w-4 h-4" /> },
    { key: 'system-info', label: 'Sistem Bilgisi', icon: <Server className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistem Ayarları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Platform yapılandırması ve sistem yönetimi
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleClearCache}
            className="flex items-center px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Önbellek Temizle
          </button>
          {activeTab !== 'system-info' && (
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Genel Ayarlar</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Site Adı
                      </label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin E-posta
                      </label>
                      <input
                        type="email"
                        value={settings.general.adminEmail}
                        onChange={(e) => updateSettings('general', 'adminEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Site Açıklaması
                    </label>
                    <textarea
                      rows={3}
                      value={settings.general.siteDescription}
                      onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Varsayılan Dil
                      </label>
                      <select
                        value={settings.general.defaultLanguage}
                        onChange={(e) => updateSettings('general', 'defaultLanguage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Zaman Dilimi
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Europe/Istanbul">Europe/Istanbul</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Bakım Modu</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Site geçici olarak kapatılır</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.general.maintenanceMode}
                          onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {settings.general.maintenanceMode && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bakım Mesajı
                        </label>
                        <textarea
                          rows={2}
                          value={settings.general.maintenanceMessage}
                          onChange={(e) => updateSettings('general', 'maintenanceMessage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Güvenlik Ayarları</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Oturum Zaman Aşımı (saniye)
                      </label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maksimum Giriş Denemesi
                      </label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hesap Kilitleme Süresi (saniye)
                    </label>
                    <input
                      type="number"
                      value={settings.security.lockoutDuration}
                      onChange={(e) => updateSettings('security', 'lockoutDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">İki Faktörlü Doğrulama</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Admin hesaplar için zorunlu</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.enableTwoFactor}
                          onChange={(e) => updateSettings('security', 'enableTwoFactor', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Güçlü Şifre Zorunluluğu</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">En az 8 karakter, büyük/küçük harf, sayı</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.requireStrongPasswords}
                          onChange={(e) => updateSettings('security', 'requireStrongPasswords', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Kullanıcı Kaydına İzin Ver</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Yeni kullanıcıların kayıt olabilmesi</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.allowUserRegistration}
                          onChange={(e) => updateSettings('security', 'allowUserRegistration', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* System Info */}
              {activeTab === 'system-info' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sistem Bilgisi</h3>
                  
                  {/* System Actions */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <button
                      onClick={handleClearCache}
                      className="flex items-center px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Önbellek Temizle
                    </button>
                    <button
                      onClick={handleDatabaseOptimize}
                      className="flex items-center px-4 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Veritabanı Optimize Et
                    </button>
                    <button
                      onClick={handleRestartServices}
                      className="flex items-center px-4 py-2 text-sm bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Servisleri Yeniden Başlat
                    </button>
                  </div>

                  {/* System Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Server Stats */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Server className="w-5 h-5 text-blue-500" />
                        <h4 className="ml-2 font-medium text-gray-900 dark:text-white">Sunucu</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                            <span className="text-gray-900 dark:text-white">{systemStats.server.uptime}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">CPU</span>
                            <span className="text-gray-900 dark:text-white">{systemStats.server.cpuUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageColor(systemStats.server.cpuUsage)}`}
                              style={{ width: `${systemStats.server.cpuUsage}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">RAM</span>
                            <span className="text-gray-900 dark:text-white">{systemStats.server.memoryUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageColor(systemStats.server.memoryUsage)}`}
                              style={{ width: `${systemStats.server.memoryUsage}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Disk</span>
                            <span className="text-gray-900 dark:text-white">{systemStats.server.diskUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUsageColor(systemStats.server.diskUsage)}`}
                              style={{ width: `${systemStats.server.diskUsage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Database Stats */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Database className="w-5 h-5 text-green-500" />
                        <h4 className="ml-2 font-medium text-gray-900 dark:text-white">Veritabanı</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Boyut</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.database.size}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Bağlantılar</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.database.connections}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Sorgular</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.database.queries.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Ort. Yanıt</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.database.avgResponseTime}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* Cache Stats */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <h4 className="ml-2 font-medium text-gray-900 dark:text-white">Önbellek</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Hit Rate</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.cache.hitRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">İstekler</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.cache.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Boyut</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.cache.cacheSize}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Evictions</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.cache.evictions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Users className="w-5 h-5 text-purple-500" />
                        <h4 className="ml-2 font-medium text-gray-900 dark:text-white">Kullanıcılar</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Toplam</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.users.totalUsers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Aktif</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.users.activeUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Yeni Kayıt</span>
                          <span className="text-gray-900 dark:text-white">{systemStats.users.newRegistrations}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Çevrimiçi</span>
                          <span className="text-green-600 dark:text-green-400">{systemStats.users.onlineUsers}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">Sistem Sağlığı</div>
                          <div className="text-lg font-semibold text-green-900 dark:text-green-100">Mükemmel</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center">
                        <Activity className="w-8 h-8 text-blue-500" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Performans</div>
                          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">İyi</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Uyarılar</div>
                          <div className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">0</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs would be implemented similarly... */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">E-posta Ayarları</h3>
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">E-posta ayarları yakında eklenecek.</p>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">İçerik Ayarları</h3>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">İçerik ayarları yakında eklenecek.</p>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Performans Ayarları</h3>
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Performans ayarları yakında eklenecek.</p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bildirim Ayarları</h3>
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Bildirim ayarları yakında eklenecek.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;