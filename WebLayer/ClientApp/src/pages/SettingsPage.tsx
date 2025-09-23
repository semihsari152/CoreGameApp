import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Key
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, updateProfile, isAuthenticated, changePassword, deleteAccount, updatePrivacySettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    activityStatus: true,
    gameList: true,
  });
  const [privacySettingsChanged, setPrivacySettingsChanged] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      bio: '',
      avatarUrl: ''
    }
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || ''
      });

      // Load privacy settings from user data (database)
      setPrivacySettings({
        profileVisibility: user.isProfileVisible ?? true,
        activityStatus: user.isActivityStatusVisible ?? true,
        gameList: user.isGameListVisible ?? true,
      });
    }
  }, [user, resetProfile]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm();

  const onProfileSubmit = async (data: any) => {
    try {
      await updateProfile(data);
      toast.success('Profil bilgileri güncellendi');
    } catch (error) {
      toast.error('Güncelleme sırasında bir hata oluştu');
    }
  };

  const onPasswordSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }
    
    try {
      await changePassword(data.currentPassword, data.newPassword);
      resetPassword();
    } catch (error) {
      // Error is already handled in useAuth hook
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Şifrenizi girin');
      return;
    }

    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
      setDeletePassword('');
    } catch (error) {
      // Error is already handled in useAuth hook
    }
  };

  const handlePrivacySettingChange = (setting: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    setPrivacySettingsChanged(true);
  };

  const savePrivacySettings = async () => {
    try {
      await updatePrivacySettings({
        IsProfileVisible: privacySettings.profileVisibility,
        IsActivityStatusVisible: privacySettings.activityStatus,
        IsGameListVisible: privacySettings.gameList
      });
      setPrivacySettingsChanged(false);
    } catch (error) {
      // Error handling is done in the useAuth hook
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ayarlarınızı görüntülemek için giriş yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'privacy', label: 'Gizlilik', icon: Eye },
    { id: 'security', label: 'Güvenlik', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-gaming font-bold text-gray-900 dark:text-white">
            Ayarlar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Hesap ayarlarınızı ve tercihlerinizi yönetin
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Profil Bilgileri
                </h2>
                
                <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ad
                      </label>
                      <input
                        {...registerProfile('firstName', {
                          required: 'Ad gereklidir'
                        })}
                        type="text"
                        className={`input ${profileErrors.firstName ? 'border-red-500' : ''}`}
                      />
                      {profileErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {profileErrors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Soyad
                      </label>
                      <input
                        {...registerProfile('lastName', {
                          required: 'Soyad gereklidir'
                        })}
                        type="text"
                        className={`input ${profileErrors.lastName ? 'border-red-500' : ''}`}
                      />
                      {profileErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {profileErrors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      {...registerProfile('bio')}
                      rows={4}
                      className="input resize-none"
                      placeholder="Kendiniz hakkında birkaç kelime..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Avatar URL
                    </label>
                    <input
                      {...registerProfile('avatarUrl', {
                        pattern: {
                          value: /^https?:\/\/.+/i,
                          message: 'Geçerli bir URL giriniz (https:// ile başlamalı)'
                        },
                        validate: (value) => {
                          if (!value) return true; // Optional field
                          // Allow Google profile URLs and common image URLs
                          const isGoogleUrl = /^https?:\/\/(lh[0-9]\.googleusercontent\.com|graph\.facebook\.com|avatars\.githubusercontent\.com)/i.test(value);
                          const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(value);
                          if (isGoogleUrl || isImageUrl) return true;
                          return 'Geçerli bir resim URL\'si giriniz veya Google profil resmi URL\'si kullanın';
                        }
                      })}
                      type="url"
                      className={`input ${profileErrors.avatarUrl ? 'border-red-500' : ''}`}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    {profileErrors.avatarUrl && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {profileErrors.avatarUrl.message}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Profil fotoğrafınız için bir URL giriniz. Google profil resmi, GitHub avatar veya standart resim formatları (JPG, PNG, GIF, WebP, SVG) desteklenir.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Değişiklikleri Kaydet
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Bildirim Tercihleri
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        E-posta Bildirimleri
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Yeni yorumlar ve beğeniler için e-posta alın
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Push Bildirimleri
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Tarayıcı bildirimleri alın
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Forum Bildirimleri
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Takip ettiğiniz konulardaki yeni mesajlar
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Pazarlama E-postaları
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Yeni özellikler ve güncellemeler hakkında bilgi alın
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button className="btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Gizlilik Ayarları
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Profil Görünürlüğü
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Profilinizi herkes görebilir
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={privacySettings.profileVisibility}
                      onChange={(e) => handlePrivacySettingChange('profileVisibility', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Aktivite Durumu
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Son görülme zamanınızı gösterin
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={privacySettings.activityStatus}
                      onChange={(e) => handlePrivacySettingChange('activityStatus', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Oyun Listesi
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Oynadığınız oyunları herkesle paylaşın
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={privacySettings.gameList}
                      onChange={(e) => handlePrivacySettingChange('gameList', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={savePrivacySettings}
                    disabled={!privacySettingsChanged}
                    className={`btn-primary ${!privacySettingsChanged ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Şifre Değiştir
                  </h2>
                  
                  <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mevcut Şifre
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('currentPassword', {
                            required: 'Mevcut şifre gereklidir'
                          })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className={`input pr-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.currentPassword.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni Şifre
                      </label>
                      <div className="relative">
                        <input
                          {...registerPassword('newPassword', {
                            required: 'Yeni şifre gereklidir',
                            minLength: {
                              value: 6,
                              message: 'Şifre en az 6 karakter olmalıdır'
                            }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className={`input pr-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.newPassword.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni Şifre Tekrar
                      </label>
                      <input
                        {...registerPassword('confirmPassword', {
                          required: 'Şifre tekrarı gereklidir'
                        })}
                        type="password"
                        className={`input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.confirmPassword.message as string}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary">
                        <Key className="w-4 h-4 mr-2" />
                        Şifreyi Güncelle
                      </button>
                    </div>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="card p-6 border-red-200 dark:border-red-800">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
                    Tehlikeli Alan
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Hesabı Sil
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Bu işlem geri alınamaz. Tüm verileriniz silinecektir.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="btn bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hesabı Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Hesabı Sil
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bu işlem geri alınamaz
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                Devam etmek için şifrenizi girin:
              </p>
              
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input w-full"
                placeholder="Mevcut şifreniz"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
                disabled={!deletePassword}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hesabı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;