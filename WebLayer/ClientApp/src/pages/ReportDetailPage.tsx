import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Flag, 
  User, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Edit,
  Save,
  FileText,
  ExternalLink
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { ReportStatus, UpdateReportDto } from '../types';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface AdminNoteForm {
  adminNote: string;
  status: ReportStatus;
}

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditingNote, setIsEditingNote] = useState(false);

  const canManageReports = user?.role === UserRole.Admin || user?.role === UserRole.Moderator;

  const {
    register,
    handleSubmit,
    reset
  } = useForm<AdminNoteForm>();

  // Fetch report details
  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => api.reports.getById(parseInt(id!)),
    enabled: !!id && canManageReports
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ status, adminNote }: { status?: ReportStatus; adminNote?: string }) => 
      api.reports.update(parseInt(id!), { status, adminNote } as UpdateReportDto),
    onSuccess: () => {
      toast.success('Rapor güncellendi');
      queryClient.invalidateQueries(['report', id]);
      setIsEditingNote(false);
    },
    onError: () => {
      toast.error('Güncelleme sırasında bir hata oluştu');
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ReportStatus.Pending.toString():
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800';
      case ReportStatus.UnderReview.toString():
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800';
      case ReportStatus.Resolved.toString():
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800';
      case ReportStatus.Rejected.toString():
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ReportStatus.Pending.toString():
        return <Clock className="w-5 h-5" />;
      case ReportStatus.UnderReview.toString():
        return <Eye className="w-5 h-5" />;
      case ReportStatus.Resolved.toString():
        return <CheckCircle className="w-5 h-5" />;
      case ReportStatus.Rejected.toString():
        return <XCircle className="w-5 h-5" />;
      default:
        return <Flag className="w-5 h-5" />;
    }
  };


  const handleStatusUpdate = (status: ReportStatus) => {
    updateReportMutation.mutate({ status });
  };

  const onAdminNoteSubmit = (data: AdminNoteForm) => {
    updateReportMutation.mutate({
      adminNote: data.adminNote,
      status: data.status
    });
  };

  const handleEditNote = () => {
    setIsEditingNote(true);
    reset({
      adminNote: report?.adminNote || '',
      status: report?.status || ReportStatus.Pending
    });
  };

  if (!canManageReports) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Rapor bulunamadı
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aradığınız rapor mevcut değil veya erişim yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/reports')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-gaming font-bold text-gray-900 dark:text-white">
                  Rapor Detayı
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Rapor ID: #{report.id}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {report.status === ReportStatus.Pending && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(ReportStatus.UnderReview)}
                    disabled={updateReportMutation.isLoading}
                    className="btn-secondary disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    İncelemeye Al
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(ReportStatus.Resolved)}
                    disabled={updateReportMutation.isLoading}
                    className="btn bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Çöz
                  </button>
                </>
              )}
              
              {report.status === ReportStatus.UnderReview && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(ReportStatus.Resolved)}
                    disabled={updateReportMutation.isLoading}
                    className="btn bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Onayla
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(ReportStatus.Rejected)}
                    disabled={updateReportMutation.isLoading}
                    className="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reddet
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Report Overview */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {report.reason}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Raporlayan: {report.reporter?.username}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(report.createdDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full border ${getStatusColor(report.status.toString())}`}>
                  {getStatusIcon(report.status.toString())}
                  <span className="ml-2 font-medium capitalize">{report.status.toString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rapor Türü ve Kategori
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {report.reportType.toString()}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    {report.reportableType.toString()}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {report.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reported Entity */}
          {(
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rapor Edilen İçerik
              </h3>
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {report.reportableType.toString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {report.reportableEntityId}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                  <button className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                    <ExternalLink className="w-4 h-4 inline mr-1" />
                    İçeriği Görüntüle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Moderatör Notları
              </h3>
              {!isEditingNote && (
                <button
                  onClick={handleEditNote}
                  className="btn-secondary text-sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {report.adminNote ? 'Düzenle' : 'Not Ekle'}
                </button>
              )}
            </div>

            {isEditingNote ? (
              <form onSubmit={handleSubmit(onAdminNoteSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Moderatör Notu
                  </label>
                  <textarea
                    {...register('adminNote')}
                    rows={4}
                    className="input resize-none"
                    placeholder="Raporla ilgili notlarınızı buraya yazın..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durum
                  </label>
                  <select {...register('status')} className="input">
                    <option value={ReportStatus.Pending}>Beklemede</option>
                    <option value={ReportStatus.UnderReview}>İnceleniyor</option>
                    <option value={ReportStatus.Resolved}>Çözüldü</option>
                    <option value={ReportStatus.Rejected}>Reddedildi</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={updateReportMutation.isLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateReportMutation.isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(false)}
                    className="btn-secondary"
                  >
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {report.adminNote ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                      {report.adminNote}
                    </p>
                    {report.reviewedByUser && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Not ekleyen: {report.reviewedByUser.username} • {report.reviewedDate ? formatDate(report.reviewedDate) : 'Tarih yok'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Henüz moderatör notu eklenmemiş.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action History */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              İşlem Geçmişi
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <Flag className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Rapor oluşturuldu</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {report.reporter?.username} tarafından • {formatDate(report.createdDate)}
                  </p>
                </div>
              </div>

              {report.status !== ReportStatus.Pending && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  {getStatusIcon(report.status.toString())}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Durum güncellendi: {report.status.toString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {report.reviewedByUser?.username || 'Sistem'} tarafından • {report.reviewedDate ? formatDate(report.reviewedDate) : 'Tarih yok'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;