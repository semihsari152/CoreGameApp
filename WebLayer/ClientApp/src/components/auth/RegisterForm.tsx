import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Gamepad2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CreateUserDto } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { isValidEmail, isValidUsername, getPasswordStrength } from '../../utils/helpers';
import { cn } from '../../utils/helpers';

const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    watch,
    setError
  } = useForm<CreateUserDto & { confirmPassword: string }>();

  const password = watch('password');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = async (data: CreateUserDto & { confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Şifreler eşleşmiyor' });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (error: any) {
      if (error.response?.data?.message?.includes('email')) {
        setError('email', { message: 'Bu e-posta adresi zaten kullanılıyor' });
      } else if (error.response?.data?.message?.includes('username')) {
        setError('username', { message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-gaming rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-gaming font-bold text-gray-900 dark:text-white">
            Kayıt Ol
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Zaten hesabınız var mı?{' '}
            <Link 
              to="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Giriş yapın
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
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
                    validate: (value) => isValidUsername(value) || 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
                  })}
                  type="text"
                  autoComplete="username"
                  className={cn(
                    'input pl-10',
                    errors.username && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="kullaniciadi"
                />
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <input
                  {...register('email', {
                    required: 'E-posta adresi gereklidir',
                    validate: (value) => isValidEmail(value) || 'Geçerli bir e-posta adresi girin'
                  })}
                  type="email"
                  autoComplete="email"
                  className={cn(
                    'input pl-10',
                    errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="ornek@email.com"
                />
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn(
                    'input pl-10 pr-10',
                    errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                      <div 
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                        )}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-medium', passwordStrength.color)}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Şifre Tekrarı
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Şifre tekrarı gereklidir'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn(
                    'input pl-10 pr-10',
                    errors.confirmPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Bio Field (Optional) */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hakkımda <span className="text-gray-500">(İsteğe Bağlı)</span>
              </label>
              <textarea
                {...register('bio', {
                  maxLength: {
                    value: 500,
                    message: 'Hakkımda bölümü en fazla 500 karakter olmalıdır'
                  }
                })}
                rows={3}
                className={cn(
                  'input resize-none',
                  errors.bio && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.bio.message}
                </p>
              )}
            </div>
          </div>

          {/* Terms & Privacy */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-dark-600 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Kullanım Şartlarını
              </Link>{' '}
              ve{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Gizlilik Politikasını
              </Link>{' '}
              kabul ediyorum
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full btn-gaming flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isSubmitting || isLoading) ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <span>Hesap Oluştur</span>
              </>
            )}
          </button>

          {/* Password Requirements */}
          <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Şifre Gereksinimleri
            </h3>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                {password && password.length >= 6 ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-gray-400" />
                )}
                <span>En az 6 karakter</span>
              </li>
              <li className="flex items-center space-x-2">
                {password && /[A-Z]/.test(password) ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-gray-400" />
                )}
                <span>En az bir büyük harf</span>
              </li>
              <li className="flex items-center space-x-2">
                {password && /[a-z]/.test(password) ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-gray-400" />
                )}
                <span>En az bir küçük harf</span>
              </li>
              <li className="flex items-center space-x-2">
                {password && /\d/.test(password) ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-gray-400" />
                )}
                <span>En az bir rakam</span>
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;