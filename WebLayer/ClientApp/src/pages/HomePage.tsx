import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Gamepad2, 
  Users, 
  MessageSquare, 
  BookOpen, 
  Star, 
  PenTool,
  PlayCircle,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Calendar,
  User,
  Eye
} from 'lucide-react';
import { apiService as api } from '../services/api';

const HomePage: React.FC = () => {
  // Fetch latest blog posts for homepage preview
  const { data: blogsResponse } = useQuery({
    queryKey: ['homepage-blogs'],
    queryFn: () => api.blogs.getAll({ 
      page: 1, 
      pageSize: 3, 
      sortBy: 'latest' 
    })
  });

  // Fetch popular games for homepage
  const { data: gamesResponse } = useQuery({
    queryKey: ['homepage-games'],
    queryFn: () => api.games.getAll({
      page: 1,
      pageSize: 4,
      sortBy: 'popularity',
      sortOrder: 'desc'
    })
  });

  // Fetch popular guides for homepage
  const { data: guidesResponse } = useQuery({
    queryKey: ['homepage-guides'],
    queryFn: () => api.guides.getAll({
      page: 1,
      pageSize: 3,
      sortBy: 'popular'
    })
  });

  // Fetch popular forum topics for homepage
  const { data: forumResponse } = useQuery({
    queryKey: ['homepage-forum'],
    queryFn: () => api.forum.getTopics({
      page: 1,
      pageSize: 3,
      sortBy: 'popular'
    })
  });

  const latestBlogs = blogsResponse?.data || [];
  const popularGames = gamesResponse?.data || [];
  const popularGuides = guidesResponse?.data || [];
  const popularTopics = forumResponse?.data || [];

  const features = [
    {
      icon: Gamepad2,
      title: 'Oyun Keşfi',
      description: 'Binlerce oyun arasından ilginizi çekenleri keşfedin. IGDB entegrasyonu ile güncel bilgiler.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: Users,
      title: 'Sosyal Topluluk',
      description: 'Oyun tutkunlarıyla bağlantı kurun, deneyimlerinizi paylaşın ve yeni arkadaşlıklar edinin.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: MessageSquare,
      title: 'Forum & Tartışma',
      description: 'Oyunlar hakkında tartışın, sorularınızı sorun ve topluluğun deneyiminden yararlanın.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: BookOpen,
      title: 'Kılavuzlar',
      description: 'Oyun kılavuzları oluşturun ve paylaşın. Diğer oyuncuların deneyimlerinden öğrenin.',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      icon: PenTool,
      title: 'Blog Yazıları',
      description: 'Oyun deneyimlerinizi paylaşın, incelemeler yazın ve toplulukla düşüncelerinizi paylaşın.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      icon: Star,
      title: 'Oyun Puanlama',
      description: 'Oynadığınız oyunları puanlayın ve yorumlayın. Topluluk puanlamalarını inceleyin.',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      icon: Shield,
      title: 'Güvenli Platform',
      description: 'Moderasyon sistemimiz sayesinde güvenli ve pozitif bir oyun topluluğu deneyimi.',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  const stats = [
    { label: 'Aktif Kullanıcı', value: '10K+', icon: Users },
    { label: 'Oyun Veritabanı', value: '5K+', icon: Gamepad2 },
    { label: 'Forum Konusu', value: '2K+', icon: MessageSquare },
    { label: 'Blog Yazısı', value: '500+', icon: PenTool },
    { label: 'Kılavuz', value: '1K+', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-gaming text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-white animate-glow" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-gaming font-bold mb-6 animate-fade-in">
              Oyun Dünyasının
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Merkezi
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-3xl mx-auto animate-slide-up">
              Oyun tutkunları için tasarlanmış sosyal platform. Oyunları keşfedin, 
              deneyimlerinizi paylaşın ve toplulukla etkileşime geçin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <Link
                to="/register"
                className="btn bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Hemen Başla
              </Link>
              <Link
                to="/games"
                className="btn border-2 border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3 text-lg font-semibold transition-all duration-300"
              >
                Oyunları Keşfet
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce-slow"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-yellow-400/30 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-blue-400/40 rounded-full animate-bounce-slow"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-gaming font-bold text-gray-900 dark:text-white mb-4">
              Platform Özellikleri
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Oyun deneyiminizi bir sonraki seviyeye taşıyacak özelliklerle dolu
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Games Preview */}
      <section className="py-20 bg-white dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-gaming font-bold text-gray-900 dark:text-white mb-4">
                Popüler Oyunlar
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Topluluk tarafından en çok beğenilen oyunlar
              </p>
            </div>
            <Link
              to="/games"
              className="btn-primary flex items-center space-x-2"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Game Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularGames.length > 0 ? (
              popularGames.map((game: any) => (
                <Link
                  key={game.id}
                  to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
                  className="card overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center overflow-hidden">
                    {game.coverImageUrl ? (
                      <img
                        src={game.coverImageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Gamepad2 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {game.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{game.rating?.toFixed(1) || 'N/A'}</span>
                      <span>•</span>
                      <span>{game.genres?.[0]?.name || 'Oyun'}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Placeholder cards when no game data
              [1, 2, 3, 4].map((index) => (
                <div key={index} className="card overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                  <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center">
                    <Gamepad2 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Oyun Adı #{index}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>4.{index}</span>
                      <span>•</span>
                      <span>RPG</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-gaming font-bold text-gray-900 dark:text-white mb-4">
                En Son Blog Yazıları
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Topluluk tarafından paylaşılan en güncel yazılar
              </p>
            </div>
            <Link
              to="/blogs"
              className="btn-primary flex items-center space-x-2"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Blog Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {latestBlogs.length > 0 ? (
              latestBlogs.map((blog: any) => (
                <Link
                  key={blog.id}
                  to={blog.slug ? `/blog/${blog.slug}` : `/blogs/${blog.id}`}
                  className="card overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-indigo-200 to-purple-300 dark:from-indigo-900 dark:to-purple-800 flex items-center justify-center">
                    <PenTool className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {blog.excerpt || blog.content?.substring(0, 150) + '...'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{blog.author?.username}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(blog.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{blog.viewCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Placeholder cards when no blog data
              [1, 2, 3].map((index) => (
                <div key={index} className="card overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-indigo-200 to-purple-300 dark:from-indigo-900 dark:to-purple-800 flex items-center justify-center">
                    <PenTool className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                      Blog Yazısı #{index}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Oyun dünyasından haberler, incelemeler ve topluluk deneyimleri...
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>Yazar {index}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date().toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>12{index}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Guides & Forum Topics */}
      <section className="py-20 bg-white dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Popular Guides */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-gaming font-bold text-gray-900 dark:text-white mb-2">
                    Popüler Kılavuzlar
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Topluluk tarafından en çok okunan kılavuzlar
                  </p>
                </div>
                <Link
                  to="/guides"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center space-x-1"
                >
                  <span>Tümü</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {popularGuides.length > 0 ? (
                  popularGuides.map((guide: any, index: number) => (
                    <Link
                      key={guide.id}
                      to={guide.slug ? `/guide/${guide.slug}` : `/guides/${guide.id}`}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {guide.description || guide.summary}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{guide.author?.username || guide.user?.username}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{guide.viewCount || 0} okuma</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-2xl font-bold text-primary-600 dark:text-primary-400">
                        #{index + 1}
                      </div>
                    </Link>
                  ))
                ) : (
                  // Placeholder guides
                  [1, 2, 3].map((index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Kılavuz Başlığı #{index}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Bu kılavuz oyunla ilgili ipuçları ve stratejiler içerir...
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Yazar {index}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{Math.floor(Math.random() * 500)} okuma</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-2xl font-bold text-primary-600 dark:text-primary-400">
                        #{index}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Popular Forum Topics */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-gaming font-bold text-gray-900 dark:text-white mb-2">
                    Popüler Forum Konuları
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    En çok tartışılan konular
                  </p>
                </div>
                <Link
                  to="/forum"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center space-x-1"
                >
                  <span>Tümü</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {popularTopics.length > 0 ? (
                  popularTopics.map((topic: any, index: number) => (
                    <Link
                      key={topic.id}
                      to={topic.slug ? `/forum/${topic.slug}` : `/forum/topic/${topic.id}`}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
                          {topic.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {topic.content?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{topic.user?.username || topic.author?.username}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{topic.replyCount || 0} yanıt</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{topic.viewCount || 0} görüntüleme</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-2xl font-bold text-primary-600 dark:text-primary-400">
                        #{index + 1}
                      </div>
                    </Link>
                  ))
                ) : (
                  // Placeholder forum topics
                  [1, 2, 3].map((index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Forum Konusu #{index}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Bu konuda oyunla ilgili önemli tartışmalar yapılıyor...
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Kullanıcı {index}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{Math.floor(Math.random() * 50)} yanıt</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{Math.floor(Math.random() * 200)} görüntüleme</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-2xl font-bold text-primary-600 dark:text-primary-400">
                        #{index}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-gaming-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-gaming font-bold mb-6">
              Büyüyen Topluluğumuza Katılın
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Binlerce oyun tutkunu ile birlikte deneyimlerinizi paylaşın, 
              yeni oyunlar keşfedin ve eğlenceli sohbetlere katılın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/forum"
                className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 font-semibold transition-all duration-300"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Forum'a Katıl
              </Link>
              <Link
                to="/blogs"
                className="btn border-2 border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3 font-semibold transition-all duration-300"
              >
                <PenTool className="w-5 h-5 mr-2" />
                Blog'u Keşfet
              </Link>
              <Link
                to="/guides"
                className="btn border-2 border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3 font-semibold transition-all duration-300"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Kılavuzları İncele
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-gaming font-bold text-gray-900 dark:text-white mb-4">
              Neden CoreGame?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Oyun tutkunları için özel olarak tasarlanmış özellikler
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Hızlı ve Modern
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                En son teknolojilerle geliştirilmiş, hızlı ve kullanıcı dostu arayüz
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Küresel Topluluk
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Dünyanın her yerinden oyun tutkunlarıyla bağlantı kurun
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Güvenli Ortam
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Moderasyon ve güvenlik önlemleriyle korunan pozitif topluluk
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;