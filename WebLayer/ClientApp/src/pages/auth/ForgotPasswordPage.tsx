import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Gamepad2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';

interface ForgotPasswordFormData {
  email: string;
}

interface ResetPasswordFormData {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors }
  } = useForm<ForgotPasswordFormData>();

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors }
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch('newPassword');

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  const startCountdown = () => {
    setResendCountdown(60); // 60 seconds countdown
  };

  const onEmailSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      // API call to send reset code
      await authAPI.sendResetCode(data.email);
      setEmail(data.email);
      setStep('code');
      startCountdown(); // Start countdown when moving to code step
      toast.success('Şifre sıfırlama kodu e-posta adresinize gönderildi.');
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
      } else {
        toast.error(error.response?.data?.message || 'Kod gönderilirken hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsLoading(true);
      // API call to reset password
      await authAPI.resetPassword(email, data.code, data.newPassword);
      setStep('success');
      toast.success('Şifreniz başarıyla sıfırlandı.');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Geçersiz veya süresi dolmuş kod. Lütfen yeni bir kod isteyin.');
      } else {
        toast.error(error.response?.data?.message || 'Şifre sıfırlanırken hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCountdown > 0) return; // Prevent spam clicks
    
    try {
      setIsLoading(true);
      await authAPI.sendResetCode(email);
      startCountdown(); // Start countdown after successful resend
      toast.success('Yeni kod gönderildi.');
    } catch (error: any) {
      toast.error('Kod tekrar gönderilirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back to Login */}
        <div className="flex justify-start mb-4">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Giriş sayfasına dön
          </Link>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-gaming rounded-2xl flex items-center justify-center shadow-xl">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-gaming font-bold text-gray-900 dark:text-white">
          {step === 'email' && 'Şifremi Unuttum'}
          {step === 'code' && 'Doğrulama Kodu'}
          {step === 'success' && 'Başarılı!'}
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {step === 'email' && 'E-posta adresinizi girin, size şifre sıfırlama kodu gönderelim'}
          {step === 'code' && `${email} adresine gönderilen kodu girin`}
          {step === 'success' && 'Şifreniz başarıyla değiştirildi'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          
          {/* Email Step */}
          {step === 'email' && (
            <form className="space-y-6" onSubmit={handleEmailSubmit(onEmailSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-posta Adresi
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerEmail('email', {
                      required: 'E-posta adresi gereklidir',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Geçerli bir e-posta adresi giriniz'
                      }
                    })}
                    type="email"
                    autoComplete="email"
                    className={`input pl-10 ${emailErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="ornek@email.com"
                  />
                  {emailErrors.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {emailErrors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailErrors.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Gönderiliyor...' : 'Kod Gönder'}
                </button>
              </div>
            </form>
          )}

          {/* Code and New Password Step */}
          {step === 'code' && (
            <form className="space-y-6" onSubmit={handleResetSubmit(onResetSubmit)}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Doğrulama Kodu
                </label>
                <input
                  {...registerReset('code', {
                    required: 'Doğrulama kodu gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Kod 6 haneli olmalıdır'
                    },
                    maxLength: {
                      value: 6,
                      message: 'Kod 6 haneli olmalıdır'
                    }
                  })}
                  type="text"
                  className={`input text-center text-lg tracking-widest ${resetErrors.code ? 'border-red-500' : ''}`}
                  placeholder="000000"
                  maxLength={6}
                />
                {resetErrors.code && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resetErrors.code.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yeni Şifre
                </label>
                <div className="mt-1 relative">
                  <input
                    {...registerReset('newPassword', {
                      required: 'Yeni şifre gereklidir',
                      minLength: {
                        value: 8,
                        message: 'Şifre en az 8 karakter olmalıdır'
                      },
                      validate: {
                        hasUppercase: (value) => /[A-Z]/.test(value) || 'En az bir büyük harf içermelidir',
                        hasLowercase: (value) => /[a-z]/.test(value) || 'En az bir küçük harf içermelidir',
                        hasNumber: (value) => /\d/.test(value) || 'En az bir rakam içermelidir',
                        hasSpecialChar: (value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) || 'En az bir özel karakter içermelidir'
                      }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`input pr-10 ${resetErrors.newPassword ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resetErrors.newPassword.message}</p>
                )}
                
                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator password={newPassword || ''} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yeni Şifre Tekrarı
                </label>
                <div className="mt-1 relative">
                  <input
                    {...registerReset('confirmPassword', {
                      required: 'Şifre tekrarı gereklidir',
                      validate: (value) => value === newPassword || 'Şifreler eşleşmiyor'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input pr-10 ${resetErrors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Şifre Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={isLoading || resendCountdown > 0}
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 
                    ? `Kodu tekrar gönder (${resendCountdown}s)`
                    : 'Kodu tekrar gönder'
                  }
                </button>
              </div>
            </form>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Şifreniz başarıyla değiştirildi
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Artık yeni şifrenizle giriş yapabilirsiniz.
                </p>
              </div>

              <div>
                <Link
                  to="/login"
                  className="btn-primary w-full justify-center"
                >
                  Giriş Sayfasına Git
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;