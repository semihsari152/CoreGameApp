import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2,
  Github,
  Twitter,
  Mail,
  Heart,
  ExternalLink
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Oyunlar', href: '/games' },
      { label: 'Forum', href: '/forum' },
      { label: 'Kılavuzlar', href: '/guides' },
      { label: 'Topluluk', href: '/community' },
    ],
    support: [
      { label: 'Yardım Merkezi', href: '/help' },
      { label: 'İletişim', href: '/contact' },
      { label: 'Geri Bildirim', href: '/feedback' },
      { label: 'Hata Bildir', href: '/report-bug' },
    ],
    legal: [
      { label: 'Gizlilik Politikası', href: '/privacy' },
      { label: 'Kullanım Şartları', href: '/terms' },
      { label: 'Çerez Politikası', href: '/cookies' },
      { label: 'KVKK', href: '/kvkk' },
    ],
    company: [
      { label: 'Hakkımızda', href: '/about' },
      { label: 'Kariyer', href: '/careers' },
      { label: 'Blog', href: '/blogs' },
      { label: 'API', href: '/api' },
    ],
  };

  const socialLinks = [
    { 
      label: 'GitHub', 
      href: 'https://github.com/coregame', 
      icon: Github 
    },
    { 
      label: 'Twitter', 
      href: 'https://twitter.com/coregame', 
      icon: Twitter 
    },
    { 
      label: 'Email', 
      href: 'mailto:info@coregame.com', 
      icon: Mail 
    },
  ];

  return (
    <footer className="bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-gaming rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-gaming font-bold text-gradient-gaming">
                CoreGame
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-sm">
              Oyun tutkunları için tasarlanmış sosyal platform. Oyunları keşfedin, 
              deneyimlerinizi paylaşın ve toplulukla etkileşime geçin.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Destek
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Yasal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Şirket
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                10K+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aktif Kullanıcı
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gaming-600 dark:text-gaming-400">
                5K+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Oyun
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                50K+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Yorum
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                1K+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Kılavuz
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Güncellemelerden Haberdar Olun
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Yeni oyunlar ve platform güncellemeleri için e-posta listemize katılın.
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Abone Ol
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
              © {currentYear} CoreGame. Tüm hakları saklıdır.
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Türkiye'de</span>
              <Heart className="w-4 h-4 text-red-500 mx-1" />
              <span>ile yapıldı</span>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Tüm sistemler çalışıyor</span>
            <a 
              href="/status" 
              className="inline-flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Sistem Durumu
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;