import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, Gamepad2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoginDto } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { isValidEmail } from '../../utils/helpers';
import { cn } from '../../utils/helpers';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginDto>();

  const onSubmit = async (data: LoginDto) => {
    try {
      await login(data);
      navigate('/');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('email', { message: 'E-posta veya şifre hatalı' });
        setError('password', { message: ' ' });
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
            Giriş Yap
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Hesabınız yok mu?{' '}
            <Link 
              to="/register" 
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Kayıt olun
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-dark-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Beni Hatırla
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Şifremi Unuttum
            </Link>
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
                <span>Giriş Yap</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-dark-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-dark-900 text-gray-500 dark:text-gray-400">
                veya
              </span>
            </div>
          </div>

          {/* Demo Account */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Demo Hesapları
            </h3>
            <div className="space-y-2 text-xs text-blue-800 dark:text-blue-300">
              <div>
                <strong>Admin:</strong> admin@coregame.com / Test123!
              </div>
              <div>
                <strong>Kullanıcı:</strong> user@coregame.com / Test123!
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            Giriş yaparak{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Kullanım Şartlarını
            </Link>{' '}
            ve{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Gizlilik Politikasını
            </Link>{' '}
            kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;