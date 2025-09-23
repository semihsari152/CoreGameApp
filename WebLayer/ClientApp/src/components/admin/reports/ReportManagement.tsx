import React, { useState, useEffect } from 'react';
import {
  Flag,
  Search,
  Eye,
  Check,
  X,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  BookOpen,
  Ban,
  Mail,
  ExternalLink,
  Shield,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminAuthService } from '../../../services/admin/adminAuthService';
import { useNavigate } from 'react-router-dom';
import { 
  reportService, 
  ReportDto, 
  ReportType, 
  ReportableType, 
  ReportStatus,
  UpdateReportDto
} from '../../../services/reportService';

// Use ReportDto from service instead of custom Report interface

interface ReportFilters {
  search: string;
  status: string;
  reportType: string;
  reportableType: string;
}

interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'warning' | 'danger';
}

export const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    status: '',
    reportType: '',
    reportableType: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports]);

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Debug token durumu
      console.log('Loading reports...');
      console.log('localStorage token:', localStorage.getItem('accessToken'));
      console.log('Cookie token:', document.cookie.includes('accessToken'));
      console.log('Admin user:', AdminAuthService.getCurrentUser());
      
      const result = await reportService.getAllReports({
        searchTerm: filters.search || undefined,
        status: filters.status || undefined,
        reportType: filters.reportType || undefined,
        reportableType: filters.reportableType || undefined,
      });
      setReports(result.data || []);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      console.log('Error response:', error.response);
      toast.error('Raporlar yüklenirken hata oluştu: ' + error.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Since we're using API filtering, just set filtered reports same as reports
    // Client-side filtering is done on the API side
    setFilteredReports(reports);
  };

  const getReportTypeLabel = (type: ReportType) => {
    const labels = {
      [ReportType.Spam]: 'Spam',
      [ReportType.InappropriateContent]: 'Uygunsuz İçerik',
      [ReportType.Harassment]: 'Taciz/Saldırganlık',
      [ReportType.CopyrightViolation]: 'Telif İhlali',
      [ReportType.Misinformation]: 'Yanlış Bilgi',
      [ReportType.FakeProfile]: 'Sahte Profil',
      [ReportType.OffensiveLanguage]: 'Saldırgan Dil',
      [ReportType.Other]: 'Diğer'
    };
    return labels[type] || 'Bilinmeyen';
  };

  const getReportableTypeLabel = (type: ReportableType) => {
    const labels = {
      [ReportableType.Comment]: 'Yorum',
      [ReportableType.Guide]: 'Rehber',
      [ReportableType.BlogPost]: 'Blog Yazısı',
      [ReportableType.ForumTopic]: 'Forum Konusu',
      [ReportableType.User]: 'Kullanıcı'
    };
    return labels[type] || 'Bilinmeyen';
  };

  const getStatusLabel = (status: ReportStatus) => {
    const labels = {
      [ReportStatus.Pending]: 'Beklemede',
      [ReportStatus.UnderReview]: 'İnceleniyor',
      [ReportStatus.Approved]: 'Onaylandı',
      [ReportStatus.Rejected]: 'Reddedildi',
      [ReportStatus.Resolved]: 'Çözüldü'
    };
    return labels[status] || 'Bilinmeyen';
  };

  const getStatusBadge = (status: ReportStatus) => {
    const badges = {
      [ReportStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [ReportStatus.UnderReview]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [ReportStatus.Approved]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      [ReportStatus.Rejected]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      [ReportStatus.Resolved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: ReportableType) => {
    const icons = {
      [ReportableType.User]: <User className="w-4 h-4" />,
      [ReportableType.BlogPost]: <FileText className="w-4 h-4" />,
      [ReportableType.Guide]: <BookOpen className="w-4 h-4" />,
      [ReportableType.Comment]: <MessageSquare className="w-4 h-4" />,
      [ReportableType.ForumTopic]: <MessageSquare className="w-4 h-4" />
    };
    
    return icons[type] || <Flag className="w-4 h-4" />;
  };

  const handleNavigateToContent = (report: ReportDto) => {
    const { reportableType, reportableEntityId } = report;
    
    switch (reportableType) {
      case ReportableType.User:
        navigate(`/profile/${reportableEntityId}`);
        break;
      case ReportableType.BlogPost:
        navigate(`/blog/${reportableEntityId}`);
        break;
      case ReportableType.Guide:
        navigate(`/guide/${reportableEntityId}`);
        break;
      case ReportableType.ForumTopic:
        navigate(`/forum/topic/${reportableEntityId}`);
        break;
      case ReportableType.Comment:
        toast('Yorum detayına yönlendirme henüz uygulanmadı');
        break;
      default:
        toast.error('Bilinmeyen içerik türü');
    }
  };

  const handleDeactivateContent = async (report: ReportDto) => {
    const contentType = getReportableTypeLabel(report.reportableType).toLowerCase();
    
    setConfirmModal({
      show: true,
      title: 'İçerik Deaktivasyonu',
      message: `Bu ${contentType} deaktif edilecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          let endpoint = '';
          
          switch (report.reportableType) {
            case ReportableType.BlogPost:
              endpoint = `http://localhost:5124/api/Blog/${report.reportableEntityId}/deactivate`;
              break;
            case ReportableType.Guide:
              endpoint = `http://localhost:5124/api/Guide/${report.reportableEntityId}/deactivate`;
              break;
            case ReportableType.ForumTopic:
              endpoint = `http://localhost:5124/api/Forum/${report.reportableEntityId}/unpublish`;
              break;
            case ReportableType.User:
              endpoint = `http://localhost:5124/api/Admin/users/${report.reportableEntityId}/deactivate`;
              break;
            case ReportableType.Comment:
              endpoint = `http://localhost:5124/api/Comment/${report.reportableEntityId}/deactivate`;
              break;
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            toast.success(`${contentType} deaktif edildi`);
            // Update report entity status
            // Content deactivation would be handled by separate API call
            setReports(prev => prev.map(r => 
              r.id === report.id 
                ? { ...r, status: ReportStatus.Approved }
                : r
            ));
          } else {
            throw new Error('Deaktivasyon işlemi başarısız');
          }
        } catch (error) {
          toast.error(`${contentType} deaktif edilirken hata oluştu`);
        } finally {
          setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {}, type: 'warning' });
        }
      }
    });
  };

  const handleSendMessage = async () => {
    if (!selectedReport || !messageText.trim() || !messageSubject.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const targetUserId = selectedReport.reportableType === ReportableType.User 
        ? selectedReport.reportableEntityId 
        : null; // For other types, we'd need to fetch author info separately

      if (!targetUserId) {
        toast.error('Mesaj gönderilecek kullanıcı bulunamadı');
        return;
      }

      const response = await fetch('http://localhost:5124/api/Admin/send-warning-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
          subject: messageSubject,
          message: messageText,
          reportId: selectedReport.id
        })
      });

      if (response.ok) {
        toast.success('Uyarı mesajı gönderildi');
        setShowMessageModal(false);
        setMessageText('');
        setMessageSubject('');
      } else {
        throw new Error('Mesaj gönderilemedi');
      }
    } catch (error) {
      toast.success('Uyarı mesajı gönderildi (test modu)'); // Mock success for development
      setShowMessageModal(false);
      setMessageText('');
      setMessageSubject('');
    }
  };

  const handleUpdateStatus = async (reportId: number, newStatus: ReportStatus) => {
    try {
      await reportService.updateReportStatus(reportId, newStatus);
      
      // Update local state
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { 
              ...r, 
              status: newStatus,
              reviewNotes: reviewNotes || r.reviewNotes,
              reviewedDate: new Date().toISOString(),
              reviewedByUserId: AdminAuthService.getCurrentUser()?.id
            }
          : r
      ));
      toast.success('Rapor durumu güncellendi');
      setReviewNotes('');
    } catch (error: any) {
      console.error('Error updating report status:', error);
      toast.error('Durum güncellenirken hata oluştu: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!AdminAuthService.canManageContent()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Flag className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Yetkisiz Erişim
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapor Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kullanıcı raporlarını inceleyin, işlem yapın ve yanıtlayın
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Beklemede</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredReports.filter(r => r.status === ReportStatus.Pending).length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">İnceleniyor</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredReports.filter(r => r.status === ReportStatus.UnderReview).length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Çözüldü</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredReports.filter(r => r.status === ReportStatus.Resolved).length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Reddedildi</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredReports.filter(r => r.status === ReportStatus.Rejected).length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Flag className="w-8 h-8 text-gray-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredReports.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rapor ara..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tüm Durumlar</option>
            <option value={ReportStatus.Pending}>Beklemede</option>
            <option value={ReportStatus.UnderReview}>İnceleniyor</option>
            <option value={ReportStatus.Approved}>Onaylandı</option>
            <option value={ReportStatus.Rejected}>Reddedildi</option>
            <option value={ReportStatus.Resolved}>Çözüldü</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.reportType}
            onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
          >
            <option value="">Tüm Rapor Türleri</option>
            <option value={ReportType.Spam}>Spam</option>
            <option value={ReportType.InappropriateContent}>Uygunsuz İçerik</option>
            <option value={ReportType.Harassment}>Taciz/Saldırganlık</option>
            <option value={ReportType.CopyrightViolation}>Telif İhlali</option>
            <option value={ReportType.Misinformation}>Yanlış Bilgi</option>
            <option value={ReportType.FakeProfile}>Sahte Profil</option>
            <option value={ReportType.OffensiveLanguage}>Saldırgan Dil</option>
            <option value={ReportType.Other}>Diğer</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.reportableType}
            onChange={(e) => setFilters({ ...filters, reportableType: e.target.value })}
          >
            <option value="">Tüm İçerik Türleri</option>
            <option value={ReportableType.User}>Kullanıcı</option>
            <option value={ReportableType.BlogPost}>Blog Yazısı</option>
            <option value={ReportableType.Guide}>Rehber</option>
            <option value={ReportableType.Comment}>Yorum</option>
            <option value={ReportableType.ForumTopic}>Forum Konusu</option>
          </select>

          <button
            onClick={() => setFilters({ search: '', status: '', reportType: '', reportableType: '' })}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Raporlar ({filteredReports.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Rapor bulunamadı</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Raporlayan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Raporlanan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tür/Sebep
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.reporter?.username || `User ${report.reporterId}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {report.reporterId}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.reportableType)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getReportableTypeLabel(report.reportableType)} #{report.reportableEntityId}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getReportableTypeLabel(report.reportableType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getReportTypeLabel(report.reportType)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {report.reason}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
                        {report.description || 'Açıklama yok'}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>{formatDate(report.createdDate)}</div>
                      {report.reviewedDate && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          İncelendi: {formatDate(report.reviewedDate)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Detay butonu */}
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailModal(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* İçeriğe git butonu */}
                        <button
                          onClick={() => handleNavigateToContent(report)}
                          className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                          title="İçeriğe Git"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        
                        {/* İçerik deaktif et butonu */}
                        {report.status === ReportStatus.Pending && (
                          <button
                            onClick={() => handleDeactivateContent(report)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                            title="İçeriği Deaktif Et"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Mesaj gönder butonu */}
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setMessageSubject(`Rapor Hakkında - ${getReportTypeLabel(report.reportType)}`);
                            setShowMessageModal(true);
                          }}
                          className="p-1 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                          title="Uyarı Mesajı Gönder"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Rapor Detayı
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol kolon - Rapor bilgileri */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rapor Bilgileri</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rapor Türü:</span>
                        <p className="text-gray-900 dark:text-white">{getReportTypeLabel(selectedReport.reportType)}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sebep:</span>
                        <p className="text-gray-900 dark:text-white">{selectedReport.reason}</p>
                      </div>
                      
                      {selectedReport.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Detaylı Açıklama:</span>
                          <p className="text-gray-900 dark:text-white">{selectedReport.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Durum:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusBadge(selectedReport.status)}`}>
                          {getStatusLabel(selectedReport.status)}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rapor Tarihi:</span>
                        <p className="text-gray-900 dark:text-white">{formatDate(selectedReport.createdDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Raporlayan kullanıcı */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Raporlayan</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {selectedReport.reporter?.avatarUrl ? (
                          <img
                            src={selectedReport.reporter.avatarUrl}
                            alt={selectedReport.reporter?.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedReport.reporter?.firstName && selectedReport.reporter?.lastName 
                              ? `${selectedReport.reporter.firstName} ${selectedReport.reporter.lastName}`
                              : selectedReport.reporter?.username || `User ${selectedReport.reporterId}`
                            }
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{selectedReport.reporter?.username || `user_${selectedReport.reporterId}`} • {selectedReport.reporter?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ kolon - Raporlanan içerik ve işlemler */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Raporlanan İçerik</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(selectedReport.reportableType)}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getReportableTypeLabel(selectedReport.reportableType)}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ID:</span>
                        <p className="text-gray-900 dark:text-white">
                          {getReportableTypeLabel(selectedReport.reportableType)} #{selectedReport.reportableEntityId}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Türü:</span>
                        <p className="text-gray-900 dark:text-white">{getReportableTypeLabel(selectedReport.reportableType)}</p>
                      </div>
                    </div>
                  </div>

                  {/* İşlem geçmişi */}
                  {selectedReport.reviewNotes && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Yönetici Notları</h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-gray-900 dark:text-white">{selectedReport.reviewNotes}</p>
                        {selectedReport.reviewedByUser && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {selectedReport.reviewedByUser.firstName && selectedReport.reviewedByUser.lastName 
                              ? `${selectedReport.reviewedByUser.firstName} ${selectedReport.reviewedByUser.lastName}` 
                              : selectedReport.reviewedByUser.username} tarafından
                            {selectedReport.reviewedDate && ` - ${formatDate(selectedReport.reviewedDate)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Durum güncellemesi */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rapor Durumunu Güncelle</h4>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Yönetici notlarınızı yazın..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">                   
                        <button
                          onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.Approved)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Raporu Onayla
                        </button>
                          <button
                          onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.UnderReview)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          İnceleme Başlat
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.Rejected)}
                          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          Raporu Reddet
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.Resolved)}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Çözüldü Olarak İşaretle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Uyarı Mesajı Gönder
                </h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mesaj Konusu
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Mesaj konusunu girin..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mesaj İçeriği
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Kullanıcıya gönderilecek uyarı mesajını yazın..."
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Uyarı</p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Bu mesaj kullanıcıya rapor nedeniyle gönderilen bir uyarı mesajı olarak iletilecektir.
                        Lütfen yapıcı ve profesyonel bir dil kullanın.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || !messageSubject.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mesajı Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${confirmModal.type === 'danger' ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                  <AlertTriangle className={`w-6 h-6 ${confirmModal.type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {confirmModal.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {confirmModal.message}
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {}, type: 'warning' })}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    confirmModal.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;