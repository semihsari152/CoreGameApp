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
import { AdminAuthService } from '../../services/admin/adminAuthService';
import { useNavigate } from 'react-router-dom';

// Enums mapping to match backend
enum ReportType {
  Spam = 1,
  InappropriateContent = 2,
  Harassment = 3,
  CopyrightViolation = 4,
  Misinformation = 5,
  FakeProfile = 6,
  OffensiveLanguage = 7,
  Other = 8
}

enum ReportableType {
  Comment = 1,
  Guide = 2,
  BlogPost = 3,
  ForumTopic = 4,
  User = 5
}

enum ReportStatus {
  Pending = 1,
  UnderReview = 2,
  Approved = 3,
  Rejected = 4,
  Resolved = 5
}

interface Report {
  id: number;
  reporterId: number;
  reportableType: ReportableType;
  reportableEntityId: number;
  reportType: ReportType;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewedByUserId?: number;
  reviewNotes?: string;
  createdDate: string;
  reviewedDate?: string;
  evidence?: string;
  
  // Navigation properties
  reporter: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  reviewedByUser?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  
  // Reportable entity details (fetched from backend)
  reportableEntity?: {
    title: string;
    authorUsername?: string;
    authorFullName?: string;
    authorId?: number;
    url?: string;
    createdDate?: string;
    isActive?: boolean;
    isPublished?: boolean;
  };
}

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
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
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
  }, [reports, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5124/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Raporlar yüklenemedi');
      }

      const result = await response.json();
      setReports(result.data || []);
    } catch (error: any) {
      // Fallback to mock data for development
      const mockReports: Report[] = [
        {
          id: 1,
          reporterId: 5,
          reportableType: ReportableType.BlogPost,
          reportableEntityId: 123,
          reportType: ReportType.InappropriateContent,
          reason: 'Bu blog yazısında uygunsuz dil kullanılmış',
          description: 'Topluluk kurallarını ihlal eden küfür ve hakaret içeren ifadeler var.',
          status: ReportStatus.Pending,
          createdDate: '2024-01-16T10:30:00Z',
          reporter: {
            id: 5,
            username: 'user123',
            email: 'user123@example.com',
            firstName: 'John',
            lastName: 'Doe',
            avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe'
          },
          reportableEntity: {
            title: 'Gaming Trends 2024',
            authorUsername: 'author_user',
            authorFullName: 'Author User',
            authorId: 10,
            url: '/blog/gaming-trends-2024',
            createdDate: '2024-01-15T10:30:00Z',
            isActive: true,
            isPublished: true
          }
        },
        {
          id: 2,
          reporterId: 6,
          reportableType: ReportableType.User,
          reportableEntityId: 456,
          reportType: ReportType.Spam,
          reason: 'Spam mesajlar gönderiyor',
          description: 'Bu kullanıcı sürekli spam mesajlar gönderiyor ve diğer kullanıcıları rahatsız ediyor.',
          status: ReportStatus.UnderReview,
          reviewedByUserId: 1,
          createdDate: '2024-01-15T14:20:00Z',
          reporter: {
            id: 6,
            username: 'reporter_user',
            email: 'reporter@example.com',
            firstName: 'Jane',
            lastName: 'Smith'
          },
          reviewedByUser: {
            id: 1,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User'
          },
          reportableEntity: {
            title: 'spammer_user',
            authorUsername: 'spammer_user',
            authorFullName: 'Spammer User',
            authorId: 456,
            url: '/profile/spammer_user',
            createdDate: '2024-01-10T08:15:00Z',
            isActive: true,
            isPublished: true
          }
        },
        {
          id: 3,
          reporterId: 7,
          reportableType: ReportableType.Guide,
          reportableEntityId: 789,
          reportType: ReportType.Misinformation,
          reason: 'Yanlış bilgi içeren rehber',
          description: 'Bu rehberdeki bilgiler tamamen yanlış ve yanıltıcı. Diğer oyuncuları yanlış yönlendirebilir.',
          status: ReportStatus.Resolved,
          reviewedByUserId: 2,
          reviewNotes: 'Rehber kontrol edildi ve yanlış bilgiler düzeltildi.',
          createdDate: '2024-01-14T16:45:00Z',
          reviewedDate: '2024-01-15T11:30:00Z',
          reporter: {
            id: 7,
            username: 'gamer_pro',
            email: 'gamerpro@example.com',
            firstName: 'Mike',
            lastName: 'Johnson'
          },
          reviewedByUser: {
            id: 2,
            username: 'moderator1',
            firstName: 'Mod',
            lastName: 'One'
          },
          reportableEntity: {
            title: 'Complete Dark Souls Guide',
            authorUsername: 'guide_author',
            authorFullName: 'Guide Author',
            authorId: 15,
            url: '/guides/789',
            createdDate: '2024-01-05T14:20:00Z',
            isActive: false,
            isPublished: false
          }
        }
      ];
      
      setReports(mockReports);
      toast.error('API bağlantısı kurulamadı, test verileri gösteriliyor');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(report => 
        report.reason.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        report.reporter.username.toLowerCase().includes(searchLower) ||
        report.reportableEntity?.title?.toLowerCase().includes(searchLower) ||
        report.reportableEntity?.authorUsername?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(report => report.status.toString() === filters.status);
    }

    if (filters.reportType) {
      filtered = filtered.filter(report => report.reportType.toString() === filters.reportType);
    }

    if (filters.reportableType) {
      filtered = filtered.filter(report => report.reportableType.toString() === filters.reportableType);
    }

    setFilteredReports(filtered);
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

  const getReportTypeBadge = (type: ReportType) => {
    const badges = {
      [ReportType.Spam]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      [ReportType.InappropriateContent]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      [ReportType.Harassment]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [ReportType.CopyrightViolation]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [ReportType.Misinformation]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [ReportType.FakeProfile]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      [ReportType.OffensiveLanguage]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      [ReportType.Other]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return badges[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  const handleNavigateToContent = (report: Report) => {
    if (!report.reportableEntity?.url) return;

    const { reportableType } = report;
    
    switch (reportableType) {
      case ReportableType.User:
        navigate(`/profile/${report.reportableEntity.authorUsername}`);
        break;
      case ReportableType.BlogPost:
        navigate(`/blog/${report.reportableEntityId}`);
        break;
      case ReportableType.Guide:
        navigate(`/guide/${report.reportableEntityId}`);
        break;
      case ReportableType.ForumTopic:
        navigate(`/forum/topic/${report.reportableEntityId}`);
        break;
      case ReportableType.Comment:
        // Navigate to the parent content with comment highlighted
        toast('Yorum detayına yönlendirme henüz uygulanmadı');
        break;
      default:
        toast.error('Bilinmeyen içerik türü');
    }
  };

  const handleDeactivateContent = async (report: Report) => {
    if (!report.reportableEntity) return;

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
            setReports(prev => prev.map(r => 
              r.id === report.id 
                ? { ...r, reportableEntity: { ...r.reportableEntity!, isActive: false, isPublished: false } }
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
        : selectedReport.reportableEntity?.authorId;

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
      const token = localStorage.getItem('accessToken');
      let endpoint = '';
      let method = '';
      let body = null;

      // Mevcut ReportController endpoint'lerini kullan
      if (newStatus === ReportStatus.Approved) {
        endpoint = `http://localhost:5124/api/reports/${reportId}/approve`;
        method = 'POST';
        body = JSON.stringify({ Notes: reviewNotes });
      } else if (newStatus === ReportStatus.Rejected) {
        endpoint = `http://localhost:5124/api/reports/${reportId}/reject`;
        method = 'POST';  
        body = JSON.stringify({ Notes: reviewNotes });
      } else if (newStatus === ReportStatus.UnderReview) {
        endpoint = `http://localhost:5124/api/reports/${reportId}/review`;
        method = 'PUT';
        body = JSON.stringify({ 
          Status: newStatus, 
          ReviewNotes: reviewNotes || 'İnceleme başlatıldı' 
        });
      } else {
        endpoint = `http://localhost:5124/api/reports/${reportId}/status`;
        method = 'PUT';
        body = JSON.stringify({ Status: newStatus.toString(), ReviewNotes: reviewNotes });
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body
      });

      if (response.ok) {
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
      } else {
        throw new Error('İstek başarısız');
      }
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
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

  if (!AdminAuthService.canManageReports()) {
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
                    Tür
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
                        {report.reporter?.avatarUrl ? (
                          <img
                            src={report.reporter.avatarUrl}
                            alt={report.reporter.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.reporter?.firstName && report.reporter?.lastName 
                              ? `${report.reporter.firstName} ${report.reporter.lastName}`
                              : report.reporter?.username || 'Bilinmeyen Kullanıcı'
                            }
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{report.reporter?.username || 'unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.reportableType)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.reportableEntity?.title || 'Bilinmeyen İçerik'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {report.reportableEntity?.authorUsername 
                              ? `${getReportableTypeLabel(report.reportableType)} - @${report.reportableEntity.authorUsername}`
                              : getReportableTypeLabel(report.reportableType)
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReportTypeBadge(report.reportType)}`}>
                        {getReportTypeLabel(report.reportType)}
                      </span>
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
                            setReviewNotes(report.reviewNotes || ''); // Mevcut notları yükle
                            setShowDetailModal(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* İçeriğe git butonu */}
                        {report.reportableEntity?.url ? (
                          <button
                            onClick={() => handleNavigateToContent(report)}
                            className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                            title="İçeriğe Git"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="p-1 text-gray-400" title="İçerik bulunamadı">
                            <ExternalLink className="w-4 h-4" />
                          </span>
                        )}
                        
                        {/* İçerik deaktif et butonu */}
                        {report.reportableEntity?.isActive && (
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
                            alt={selectedReport.reporter.username}
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
                              : selectedReport.reporter?.username || 'Bilinmeyen Kullanıcı'
                            }
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{selectedReport.reporter?.username || 'unknown'} • {selectedReport.reporter?.email || 'email@unknown.com'}
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
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">İçerik:</span>
                        <p className="text-gray-900 dark:text-white">
                          {selectedReport.reportableEntity?.title || 'Bilinmeyen İçerik'}
                        </p>
                        {selectedReport.reportableEntity?.authorUsername && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Yazar: @{selectedReport.reportableEntity.authorUsername}
                            {selectedReport.reportableEntity.authorFullName && 
                              ` (${selectedReport.reportableEntity.authorFullName})`
                            }
                          </p>
                        )}
                        {selectedReport.reportableEntity?.url && (
                          <a 
                            href={selectedReport.reportableEntity.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block"
                          >
                            İçeriği Görüntüle →
                          </a>
                        )}
                      </div>
                      
                    </div>
                  </div>

                  {/* İşlem geçmişi */}
                  {(selectedReport.reviewNotes || selectedReport.reviewedByUser) && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">İşlem Geçmişi</h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                        {selectedReport.reviewNotes && (
                          <div>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Yönetici Notları:</span>
                            <p className="text-gray-900 dark:text-white mt-1">{selectedReport.reviewNotes}</p>
                          </div>
                        )}
                        {selectedReport.reviewedByUser && (
                          <div className="border-t border-blue-200 dark:border-blue-800 pt-2">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">İşlemi Yapan:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                  {selectedReport.reviewedByUser.firstName?.charAt(0) || selectedReport.reviewedByUser.username?.charAt(0) || 'A'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedReport.reviewedByUser.firstName && selectedReport.reviewedByUser.lastName
                                    ? `${selectedReport.reviewedByUser.firstName} ${selectedReport.reviewedByUser.lastName}`
                                    : selectedReport.reviewedByUser.username || 'Bilinmeyen'
                                  }
                                </p>
                                {selectedReport.reviewedDate && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatDate(selectedReport.reviewedDate)}
                                  </p>
                                )}
                              </div>
                            </div>
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
                          onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.UnderReview)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          İnceleme Başlat
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.Approved)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Raporu Onayla
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