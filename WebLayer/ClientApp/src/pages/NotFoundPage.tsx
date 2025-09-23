import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Gamepad2 } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-gaming font-bold text-gray-200 dark:text-dark-700 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gamepad2 className="w-16 h-16 text-primary-600 dark:text-primary-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl md:text-3xl font-gaming font-bold text-gray-900 dark:text-white mb-4">
          Sayfa Bulunamadı
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. 
          Ana sayfaya dönebilir veya arama yapabilirsiniz.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>
          <Link
            to="/games"
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Oyunları Keşfet</span>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Popüler bölümler:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/games"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Oyunlar
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              to="/forum"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Forum
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link
              to="/guides"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Kılavuzlar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;