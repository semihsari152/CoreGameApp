import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Flag, 
  Plus, 
  Search, 
  AlertTriangle, 
  MessageSquare, 
  User, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Shield
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { Report, ReportStatus, ReportType, ReportableType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface ReportFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  status: 'all' | 'pending' | 'reviewing' | 'resolved' | 'rejected';
  reportType: 'all' | 'user' | 'comment' | 'game' | 'guide' | 'blog' | 'forum';
  sortBy: 'latest' | 'priority' | 'status';
}

const ReportsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>({
    page: 1,
    pageSize: 20,
    searchTerm: '',
    status: 'all',
    reportType: 'all',
    sortBy: 'latest'
  });

  // Check if user has admin/moderator privileges
  const canManageReports = user?.role === UserRole.Admin || user?.role === UserRole.Moderator;

  // Fetch reports
  const { data: reportsResponse, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => api.reports.getAll(filters),
    keepPreviousData: true,
    enabled: isAuthenticated && canManageReports
  });

  // Update report status mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      api.reports.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Rapor durumu güncellendi');
      queryClient.invalidateQueries(['reports']);
    },
    onError: () => {
      toast.error('Güncelleme sırasında bir hata oluştu');
    }
  });

  const reports = reportsResponse?.data || [];

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleStatusUpdate = (reportId: number, status: string) => {
    updateReportMutation.mutate({ id: reportId, status });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case ReportStatus.UnderReview:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case ReportStatus.Resolved:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case ReportStatus.Rejected:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending:
        return <Clock className="w-4 h-4" />;
      case ReportStatus.UnderReview:
        return <Eye className="w-4 h-4" />;
      case ReportStatus.Resolved:
        return <CheckCircle className="w-4 h-4" />;
      case ReportStatus.Rejected:
        return <XCircle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (reportType: ReportType) => {
    // Map report types to priority colors
    switch (reportType) {
      case ReportType.Harassment:
      case ReportType.CopyrightViolation:
        return 'text-red-600 dark:text-red-400';
      case ReportType.InappropriateContent:
      case ReportType.OffensiveLanguage:
        return 'text-yellow-600 dark:text-yellow-400';
      case ReportType.Spam:
      case ReportType.Misinformation:
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case ReportType.FakeProfile:
        return <User className="w-4 h-4" />;
      case ReportType.InappropriateContent:
      case ReportType.OffensiveLanguage:
        return <MessageSquare className="w-4 h-4" />;
      case ReportType.Harassment:
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Raporları görüntülemek için giriş yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  if (!canManageReports) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Yetki Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfayı görüntülemek için moderatör yetkisine sahip olmalısınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-gaming font-bold text-gray-900 dark:text-white">
                Rapor Yönetimi
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {reportsResponse?.totalCount || 0} rapor bulundu
              </p>
            </div>

            <Link
              to="/reports/create"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Rapor
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Raporlarda ara..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="input pl-10 pr-4 w-full"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="reviewing">İnceleniyor</option>
              <option value="resolved">Çözüldü</option>
              <option value="rejected">Reddedildi</option>
            </select>

            <select
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="input"
            >
              <option value="all">Tüm Türler</option>
              <option value="user">Kullanıcı</option>
              <option value="comment">Yorum</option>
              <option value="game">Oyun</option>
              <option value="guide">Kılavuz</option>
              <option value="blog">Blog</option>
              <option value="forum">Forum</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input"
            >
              <option value="latest">En Yeni</option>
              <option value="priority">Öncelik</option>
              <option value="status">Durum</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Raporlar yükleniyor...</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Rapor bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Seçilen kriterlere uygun rapor bulunmamaktadır.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report: Report) => (
              <div
                key={report.id}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-full ${getStatusColor(report.status)}`}>
                        {getReportTypeIcon(report.reportType)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {report.reason}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1 capitalize">{ReportStatus[report.status]}</span>
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(report.reportType)}`}>
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {ReportType[report.reportType]?.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Raporlayan: {report.reporter?.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(report.createdDate)}</span>
                      </div>
                      {report.reportableEntityId && (
                        <div className="flex items-center space-x-1">
                          <Flag className="w-3 h-3" />
                          <span>Hedef: {ReportableType[report.reportableType]}</span>
                        </div>
                      )}
                    </div>

                    {report.adminNote && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Admin Notu:</strong> {report.adminNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/reports/${report.id}`}
                      className="btn-secondary text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Görüntüle
                    </Link>

                    {report.status === ReportStatus.Pending && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.UnderReview.toString())}
                          disabled={updateReportMutation.isLoading}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
                          title="İncelemeye Al"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.Resolved.toString())}
                          disabled={updateReportMutation.isLoading}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                          title="Çözüldü"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.Rejected.toString())}
                          disabled={updateReportMutation.isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                          title="Reddet"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {report.status === ReportStatus.UnderReview && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.Resolved.toString())}
                          disabled={updateReportMutation.isLoading}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                          title="Çözüldü"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(report.id, ReportStatus.Rejected.toString())}
                          disabled={updateReportMutation.isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                          title="Reddet"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;