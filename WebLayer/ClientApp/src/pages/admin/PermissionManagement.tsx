import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Crown,
  Key,
  UserCheck,
  Clock,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminAuthService } from '../../services/admin/adminAuthService';

interface Permission {
  id: number;
  name: string;
  key: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

interface UserPermission {
  id: number;
  userId: number;
  permissionId: number;
  grantedAt: string;
  grantedBy: string;
  notes?: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  permission: Permission;
}

interface PermissionGrant {
  userId: number;
  permissionId: number;
  notes?: string;
}

export const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [filteredUserPermissions, setFilteredUserPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'permissions' | 'user-permissions'>('permissions');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [grantNotes, setGrantNotes] = useState('');

  // Mock users for demo
  const [users] = useState([
    { id: 1, username: 'admin', email: 'admin@coregame.com', firstName: 'Admin', lastName: 'User' },
    { id: 2, username: 'john_doe', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
    { id: 3, username: 'jane_smith', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
    { id: 4, username: 'test_user', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [permissions, userPermissions, searchTerm, categoryFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Mock permissions data
      const mockPermissions: Permission[] = [
        {
          id: 1,
          name: 'Kullanıcı Yönetimi',
          key: 'users.manage',
          category: 'User Management',
          description: 'Kullanıcıları yönetme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'İçerik Yönetimi',
          key: 'content.manage',
          category: 'Content Management',
          description: 'Blog ve rehberleri yönetme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'Rapor Yönetimi',
          key: 'reports.manage',
          category: 'Report Management',
          description: 'Kullanıcı raporlarını yönetme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          name: 'Sistem Ayarları',
          key: 'system.manage',
          category: 'System Management',
          description: 'Sistem ayarlarını yönetme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        },
        {
          id: 5,
          name: 'Admin Yönetimi',
          key: 'admin.manage',
          category: 'Admin Management',
          description: 'Admin yetkilerini yönetme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        },
        {
          id: 6,
          name: 'İşlem Geçmişi',
          key: 'audit.view',
          category: 'Audit Management',
          description: 'Sistem işlem geçmişini görüntüleme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        },
        {
          id: 7,
          name: 'Oyun Yönetimi',
          key: 'games.manage',
          category: 'Game Management',
          description: 'Oyun verilerini yönetme yetkisi',
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
          updatedDate: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock user permissions data
      const mockUserPermissions: UserPermission[] = [
        {
          id: 1,
          userId: 1,
          permissionId: 1,
          grantedAt: '2024-01-01T10:00:00Z',
          grantedBy: 'system',
          notes: 'Admin kullanıcısı - tüm yetkiler',
          user: users[0],
          permission: mockPermissions[0]
        },
        {
          id: 2,
          userId: 1,
          permissionId: 2,
          grantedAt: '2024-01-01T10:00:00Z',
          grantedBy: 'system',
          notes: 'Admin kullanıcısı - tüm yetkiler',
          user: users[0],
          permission: mockPermissions[1]
        },
        {
          id: 3,
          userId: 2,
          permissionId: 3,
          grantedAt: '2024-01-05T14:30:00Z',
          grantedBy: 'admin',
          notes: 'Rapor moderation yetkisi verildi',
          user: users[1],
          permission: mockPermissions[2]
        }
      ];

      setPermissions(mockPermissions);
      setUserPermissions(mockUserPermissions);
    } catch (error: any) {
      toast.error('Veri yüklenirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter permissions
    let filteredPerms = [...permissions];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredPerms = filteredPerms.filter(perm => 
        perm.name.toLowerCase().includes(searchLower) ||
        perm.key.toLowerCase().includes(searchLower) ||
        perm.category.toLowerCase().includes(searchLower)
      );
    }

    if (categoryFilter) {
      filteredPerms = filteredPerms.filter(perm => perm.category === categoryFilter);
    }

    setFilteredPermissions(filteredPerms);

    // Filter user permissions
    let filteredUserPerms = [...userPermissions];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredUserPerms = filteredUserPerms.filter(userPerm => 
        userPerm.user.username.toLowerCase().includes(searchLower) ||
        userPerm.user.email.toLowerCase().includes(searchLower) ||
        userPerm.permission.name.toLowerCase().includes(searchLower)
      );
    }

    if (categoryFilter) {
      filteredUserPerms = filteredUserPerms.filter(userPerm => 
        userPerm.permission.category === categoryFilter
      );
    }

    setFilteredUserPermissions(filteredUserPerms);
  };

  const handleGrantPermission = async () => {
    if (!selectedUserId || !selectedPermissionId) {
      toast.error('Kullanıcı ve yetki seçiniz');
      return;
    }

    try {
      // Check if permission already exists
      const exists = userPermissions.some(up => 
        up.userId === selectedUserId && up.permissionId === selectedPermissionId
      );

      if (exists) {
        toast.error('Bu kullanıcı zaten bu yetkiye sahip');
        return;
      }

      const user = users.find(u => u.id === selectedUserId);
      const permission = permissions.find(p => p.id === selectedPermissionId);

      if (!user || !permission) {
        toast.error('Kullanıcı veya yetki bulunamadı');
        return;
      }

      const newUserPermission: UserPermission = {
        id: userPermissions.length + 1,
        userId: selectedUserId,
        permissionId: selectedPermissionId,
        grantedAt: new Date().toISOString(),
        grantedBy: AdminAuthService.getCurrentUser()?.username || 'admin',
        notes: grantNotes,
        user,
        permission
      };

      setUserPermissions([...userPermissions, newUserPermission]);
      toast.success('Yetki başarıyla verildi');
      
      // Reset form
      setSelectedUserId(null);
      setSelectedPermissionId(null);
      setGrantNotes('');
      setShowGrantModal(false);
    } catch (error: any) {
      toast.error('Yetki verilirken hata oluştu: ' + error.message);
    }
  };

  const handleRevokePermission = async (userPermissionId: number) => {
    if (!window.confirm('Bu yetkiyi kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setUserPermissions(userPermissions.filter(up => up.id !== userPermissionId));
      toast.success('Yetki başarıyla kaldırıldı');
    } catch (error: any) {
      toast.error('Yetki kaldırılırken hata oluştu: ' + error.message);
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'User Management': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Content Management': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Report Management': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'System Management': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Admin Management': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Audit Management': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'Game Management': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(permissions.map(p => p.category)));
  };

  if (!AdminAuthService.canManageAdmins()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
            Yetki Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem yetkileri ve kullanıcı izinlerini yönetin
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yetki Ver
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Sistem Yetkileri ({filteredPermissions.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('user-permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'user-permissions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Kullanıcı Yetkileri ({filteredUserPermissions.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ara..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'permissions' ? (
        /* Permissions Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Sistem Yetkileri
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredPermissions.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Yetki bulunamadı</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Yetki Adı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Anahtar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPermissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {permission.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                          {permission.key}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(permission.category)}`}>
                          {permission.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {permission.description || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {permission.isActive ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">Aktif</span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-600 dark:text-red-400">İnaktif</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* User Permissions Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Kullanıcı Yetkileri
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredUserPermissions.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Kullanıcı yetkisi bulunamadı</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Yetki
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Veren
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
                  {filteredUserPermissions.map((userPermission) => (
                    <tr key={userPermission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {userPermission.user.firstName && userPermission.user.lastName 
                                ? `${userPermission.user.firstName} ${userPermission.user.lastName}`
                                : userPermission.user.username
                              }
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userPermission.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {userPermission.permission.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <code className="text-xs">{userPermission.permission.key}</code>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(userPermission.permission.category)}`}>
                          {userPermission.permission.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {userPermission.grantedBy}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(userPermission.grantedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleRevokePermission(userPermission.id)}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Yetkiyi Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Grant Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Yetki Ver
                </h3>
                <button
                  onClick={() => setShowGrantModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kullanıcı
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Kullanıcı seçin</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : `${user.username} (${user.email})`
                        }
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yetki
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={selectedPermissionId || ''}
                    onChange={(e) => setSelectedPermissionId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Yetki seçin</option>
                    {permissions.map(permission => (
                      <option key={permission.id} value={permission.id}>
                        {permission.name} ({permission.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Not (İsteğe bağlı)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Bu yetkinin verilme sebebini açıklayın..."
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={handleGrantPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Yetki Ver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagement;