import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft, Loader } from 'lucide-react';
import { apiService } from '../services/api';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Geçersiz doğrulama linki. Token bulunamadı.');
        return;
      }

      try {
        await apiService.auth.verifyEmailWithToken(token);
        setStatus('success');
        setMessage('Email adresiniz başarıyla doğrulandı!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email doğrulama sırasında bir hata oluştu.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-100 dark:border-dark-700">

          {/* Status Icon and Message */}
          <div className="mb-10">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-primary-100 dark:from-blue-900/30 dark:to-primary-900/30 rounded-full flex items-center justify-center shadow-lg">
                    <Loader className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-spin" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Email Doğrulanıyor
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Lütfen bekleyin, hesabınız aktifleştiriliyor...
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">
                    🎉 Tebrikler!
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-lg">
                    {message}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Artık CoreGame'in tüm özelliklerini kullanabilirsiniz!
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center shadow-lg">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-red-800 dark:text-red-200">
                    Doğrulama Başarısız
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && (
              <Link
                to="/profile"
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <span>Profile Git</span>
              </Link>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Link
                  to="/profile"
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Yeni Doğrulama Emaili Gönder</span>
                </Link>
              </div>
            )}

            <Link
              to="/"
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>

          {/* Additional Info */}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sorun devam ederse, profil sayfanızdan yeni bir doğrulama emaili talep edebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;