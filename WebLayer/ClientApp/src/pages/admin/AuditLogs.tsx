import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  User,
  Calendar,
  Globe,
  Monitor,
  Shield,
  Key,
  FileText,
  UserCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Settings,
  Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminAuthService } from '../../services/admin/adminAuthService';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  notes?: string;
  timestamp: string;
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  severity: 'info' | 'warning' | 'error' | 'success';
  category: 'USER_ACTION' | 'ADMIN_ACTION' | 'SYSTEM_EVENT' | 'SECURITY_EVENT' | 'DATA_CHANGE' | 'LOGIN_EVENT';
}

interface AuditLogFilters {
  search: string;
  userId: string;
  action: string;
  category: string;
  severity: string;
  dateFrom: string;
  dateTo: string;
  ipAddress: string;
}

export const AuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    userId: '',
    action: '',
    category: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    ipAddress: ''
  });

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      // Mock audit log data
      const mockAuditLogs: AuditLog[] = [
        {
          id: 1,
          userId: 1,
          action: 'ADMIN_LOGIN',
          description: 'Admin kullanıcısı sisteme giriş yaptı',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-01-16T09:30:00Z',
          user: {
            id: 1,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@coregame.com'
          },
          severity: 'info',
          category: 'LOGIN_EVENT'
        },
        {
          id: 2,
          userId: 1,
          action: 'GRANT_PERMISSION',
          entityType: 'UserAdminPermission',
          entityId: 123,
          oldValue: undefined,
          newValue: '{"permission":"users.manage","target_user":"john_doe"}',
          description: 'john_doe kullanıcısına users.manage yetkisi verildi',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-01-16T10:15:00Z',
          user: {
            id: 1,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@coregame.com'
          },
          severity: 'warning',
          category: 'ADMIN_ACTION',
          notes: 'Yetki verme işlemi admin panelinden gerçekleştirildi'
        },
        {
          id: 3,
          userId: 2,
          action: 'UPDATE_PROFILE',
          entityType: 'User',
          entityId: 2,
          oldValue: '{"firstName":"John","lastName":"Old"}',
          newValue: '{"firstName":"John","lastName":"Doe"}',
          description: 'Kullanıcı profil bilgilerini güncelledi',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: '2024-01-16T11:45:00Z',
          user: {
            id: 2,
            username: 'john_doe',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          severity: 'info',
          category: 'USER_ACTION'
        },
        {
          id: 4,
          userId: 1,
          action: 'DELETE_CONTENT',
          entityType: 'BlogPost',
          entityId: 456,
          oldValue: '{"title":"Inappropriate Content","status":"published"}',
          newValue: undefined,
          description: 'Uygunsuz içerik nedeniyle blog yazısı silindi',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-01-16T12:30:00Z',
          user: {
            id: 1,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@coregame.com'
          },
          severity: 'warning',
          category: 'ADMIN_ACTION',
          notes: 'Kullanıcı raporu sonrasında içerik kaldırıldı'
        },
        {
          id: 5,
          userId: 3,
          action: 'FAILED_LOGIN_ATTEMPT',
          description: 'Başarısız giriş denemesi - yanlış şifre',
          ipAddress: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          timestamp: '2024-01-16T13:15:00Z',
          user: {
            id: 3,
            username: 'suspicious_user',
            firstName: 'Suspicious',
            lastName: 'User',
            email: 'suspicious@example.com'
          },
          severity: 'error',
          category: 'SECURITY_EVENT',
          notes: 'Şüpheli IP adresinden gelen deneme'
        },
        {
          id: 6,
          userId: 0,
          action: 'SYSTEM_BACKUP',
          description: 'Otomatik sistem yedeklemesi tamamlandı',
          ipAddress: '127.0.0.1',
          userAgent: 'System/1.0',
          timestamp: '2024-01-16T02:00:00Z',
          user: {
            id: 0,
            username: 'system',
            firstName: 'System',
            lastName: 'Process',
            email: 'system@coregame.com'
          },
          severity: 'success',
          category: 'SYSTEM_EVENT'
        },
        {
          id: 7,
          userId: 2,
          action: 'CREATE_CONTENT',
          entityType: 'Guide',
          entityId: 789,
          oldValue: undefined,
          newValue: '{"title":"Dark Souls Boss Guide","status":"published"}',
          description: 'Yeni rehber oluşturuldu ve yayınlandı',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: '2024-01-16T14:20:00Z',
          user: {
            id: 2,
            username: 'john_doe',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          },
          severity: 'info',
          category: 'USER_ACTION'
        },
        {
          id: 8,
          userId: 1,
          action: 'REVOKE_PERMISSION',
          entityType: 'UserAdminPermission',
          entityId: 124,
          oldValue: '{"permission":"content.manage","target_user":"jane_smith"}',
          newValue: undefined,
          description: 'jane_smith kullanıcısının content.manage yetkisi kaldırıldı',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-01-16T15:45:00Z',
          user: {
            id: 1,
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@coregame.com'
          },
          severity: 'warning',
          category: 'ADMIN_ACTION',
          notes: 'Yetki kaldırma işlemi performans sorunları nedeniyle'
        }
      ];

      setAuditLogs(mockAuditLogs);
      setTotalPages(1);
    } catch (error: any) {
      toast.error('Denetim kayıtları yüklenirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        log.user.username.toLowerCase().includes(searchLower) ||
        log.ipAddress.includes(searchLower)
      );
    }

    if (filters.userId) {
      filtered = filtered.filter(log => 
        log.user.username.toLowerCase().includes(filters.userId.toLowerCase())
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }

    if (filters.ipAddress) {
      filtered = filtered.filter(log => log.ipAddress.includes(filters.ipAddress));
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    setFilteredLogs(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    const labels = {
      info: 'Bilgi',
      success: 'Başarılı',
      warning: 'Uyarı',
      error: 'Hata'
    };

    const icons = {
      info: <Info className="w-3 h-3" />,
      success: <CheckCircle className="w-3 h-3" />,
      warning: <AlertTriangle className="w-3 h-3" />,
      error: <XCircle className="w-3 h-3" />
    };

    return { 
      class: badges[severity as keyof typeof badges], 
      label: labels[severity as keyof typeof labels],
      icon: icons[severity as keyof typeof icons]
    };
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      USER_ACTION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ADMIN_ACTION: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      SYSTEM_EVENT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      SECURITY_EVENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      DATA_CHANGE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      LOGIN_EVENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    
    const labels = {
      USER_ACTION: 'Kullanıcı İşlemi',
      ADMIN_ACTION: 'Admin İşlemi',
      SYSTEM_EVENT: 'Sistem Olayı',
      SECURITY_EVENT: 'Güvenlik Olayı',
      DATA_CHANGE: 'Veri Değişikliği',
      LOGIN_EVENT: 'Giriş Olayı'
    };

    const icons = {
      USER_ACTION: <User className="w-3 h-3" />,
      ADMIN_ACTION: <Shield className="w-3 h-3" />,
      SYSTEM_EVENT: <Settings className="w-3 h-3" />,
      SECURITY_EVENT: <AlertTriangle className="w-3 h-3" />,
      DATA_CHANGE: <Database className="w-3 h-3" />,
      LOGIN_EVENT: <Key className="w-3 h-3" />
    };

    return { 
      class: badges[category as keyof typeof badges], 
      label: labels[category as keyof typeof labels],
      icon: icons[category as keyof typeof icons]
    };
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Key className="w-4 h-4" />;
    if (action.includes('PERMISSION')) return <UserCheck className="w-4 h-4" />;
    if (action.includes('DELETE')) return <XCircle className="w-4 h-4" />;
    if (action.includes('CREATE')) return <CheckCircle className="w-4 h-4" />;
    if (action.includes('UPDATE')) return <FileText className="w-4 h-4" />;
    if (action.includes('SYSTEM')) return <Settings className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const getUniqueActions = () => {
    return Array.from(new Set(auditLogs.map(log => log.action)));
  };

  if (!AdminAuthService.hasPermission('audit.view')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <History className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
            İşlem Geçmişi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem denetim kayıtları ve kullanıcı aktiviteleri
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Kullanıcı İşlemleri</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredLogs.filter(log => log.category === 'USER_ACTION').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin İşlemleri</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredLogs.filter(log => log.category === 'ADMIN_ACTION').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Güvenlik Olayları</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredLogs.filter(log => log.category === 'SECURITY_EVENT').length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <History className="w-8 h-8 text-gray-500" />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Kayıt</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredLogs.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Arama yapın..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <input
            type="text"
            placeholder="Kullanıcı ara..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          />

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Tüm Kategoriler</option>
            <option value="USER_ACTION">Kullanıcı İşlemleri</option>
            <option value="ADMIN_ACTION">Admin İşlemleri</option>
            <option value="SYSTEM_EVENT">Sistem Olayları</option>
            <option value="SECURITY_EVENT">Güvenlik Olayları</option>
            <option value="DATA_CHANGE">Veri Değişiklikleri</option>
            <option value="LOGIN_EVENT">Giriş Olayları</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="">Tüm Önem Düzeyleri</option>
            <option value="info">Bilgi</option>
            <option value="success">Başarılı</option>
            <option value="warning">Uyarı</option>
            <option value="error">Hata</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">Tüm İşlemler</option>
            {getUniqueActions().map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="IP adresi..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.ipAddress}
            onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
          />

          <div className="flex space-x-2">
            <input
              type="date"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <input
              type="date"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>

          <button
            onClick={() => setFilters({ search: '', userId: '', action: '', category: '', severity: '', dateFrom: '', dateTo: '', ipAddress: '' })}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              İşlem Geçmişi ({filteredLogs.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Denetim kaydı bulunamadı</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Zaman
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Önem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    IP Adresi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map((log) => {
                  const severityBadge = getSeverityBadge(log.severity);
                  const categoryBadge = getCategoryBadge(log.category);
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-500" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.user.firstName && log.user.lastName 
                                ? `${log.user.firstName} ${log.user.lastName}`
                                : log.user.username
                              }
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              @{log.user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.action}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {log.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${categoryBadge.class}`}>
                            {categoryBadge.icon}
                            <span className="ml-1">{categoryBadge.label}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${severityBadge.class}`}>
                            {severityBadge.icon}
                            <span className="ml-1">{severityBadge.label}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {log.ipAddress}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowLogModal(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Detaylar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Sayfa {currentPage} / {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  İşlem Detayı
                </h3>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zaman</label>
                    <div className="text-gray-900 dark:text-white">
                      {formatDate(selectedLog.timestamp)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kullanıcı</label>
                    <div className="text-gray-900 dark:text-white">
                      {selectedLog.user.firstName && selectedLog.user.lastName 
                        ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (@${selectedLog.user.username})`
                        : `@${selectedLog.user.username}`
                      }
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedLog.user.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İşlem</label>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(selectedLog.action)}
                      <span className="text-gray-900 dark:text-white font-mono text-sm">
                        {selectedLog.action}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full ${getCategoryBadge(selectedLog.category).class}`}>
                        {getCategoryBadge(selectedLog.category).icon}
                        <span className="ml-1">{getCategoryBadge(selectedLog.category).label}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Önem Düzeyi</label>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full ${getSeverityBadge(selectedLog.severity).class}`}>
                        {getSeverityBadge(selectedLog.severity).icon}
                        <span className="ml-1">{getSeverityBadge(selectedLog.severity).label}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Adresi</label>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-mono">
                        {selectedLog.ipAddress}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Açıklama</label>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white">
                      {selectedLog.description}
                    </div>
                  </div>

                  {selectedLog.entityType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etkilenen Varlık</label>
                      <div className="text-gray-900 dark:text-white">
                        {selectedLog.entityType} (ID: {selectedLog.entityId})
                      </div>
                    </div>
                  )}

                  {selectedLog.oldValue && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Önceki Değer</label>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedLog.oldValue}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.newValue && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yeni Değer</label>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedLog.newValue}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notlar</label>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-gray-900 dark:text-white">
                        {selectedLog.notes}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Agent</label>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                          {selectedLog.userAgent}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;