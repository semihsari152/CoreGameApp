import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield,
  Mail,
  Calendar,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Crown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminAuthService } from '../../services/admin/adminAuthService';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  role: string;
  xpPoints: number;
  createdAt: string;
  lastLoginAt?: string;
  isAdmin: boolean;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  isAdmin: boolean | null;
}

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: '',
    isAdmin: null
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await AdminAuthService.getAllUsers();
      
      // Transform API data to match our User interface
      const transformedUsers: User[] = usersData.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        role: user.role === 3 ? 'Admin' : user.role === 2 ? 'Moderator' : 'User',
        xpPoints: user.xp || 0,
        createdAt: user.createdAt || user.createdDate,
        lastLoginAt: user.lastLoginAt || user.lastLoginDate,
        isAdmin: user.role === 3
      }));

      setUsers(transformedUsers);
      setTotalPages(1);
    } catch (error: any) {
      toast.error('Kullanıcılar yüklenirken hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.status) {
      if (filters.status === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    if (filters.isAdmin !== null) {
      filtered = filtered.filter(user => user.isAdmin === filters.isAdmin);
    }

    setFilteredUsers(filtered);
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      await AdminAuthService.toggleUserStatus(userId);
      
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      );
      setUsers(updatedUsers);
      
      const user = users.find(u => u.id === userId);
      toast.success(`Kullanıcı ${user?.isActive ? 'deaktif' : 'aktif'} edildi`);
    } catch (error: any) {
      toast.error('Kullanıcı durumu güncellenirken hata oluştu: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await AdminAuthService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      toast.success('Kullanıcı silindi');
    } catch (error: any) {
      toast.error('Kullanıcı silinirken hata oluştu: ' + error.message);
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    try {
      await AdminAuthService.makeUserAdmin(userId);
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, isAdmin: true, role: 'Admin' } : user
      );
      setUsers(updatedUsers);
      toast.success('Kullanıcıya admin yetkisi verildi');
    } catch (error: any) {
      toast.error('Admin yetkisi verilirken hata oluştu: ' + error.message);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    try {
      await AdminAuthService.removeUserAdmin(userId);
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, isAdmin: false, role: 'User' } : user
      );
      setUsers(updatedUsers);
      toast.success('Admin yetkisi kaldırıldı');
    } catch (error: any) {
      toast.error('Admin yetkisi kaldırılırken hata oluştu: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Hiç giriş yapmamış';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Moderator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (!AdminAuthService.canManageUsers()) {
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
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem kullanıcılarını yönetin ve izleyin
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Role Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">Tüm Roller</option>
            <option value="Admin">Admin</option>
            <option value="Moderator">Moderator</option>
            <option value="User">Kullanıcı</option>
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">İnaktif</option>
          </select>

          {/* Admin Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={filters.isAdmin === null ? '' : filters.isAdmin.toString()}
            onChange={(e) => setFilters({ ...filters, isAdmin: e.target.value === '' ? null : e.target.value === 'true' })}
          >
            <option value="">Tüm Kullanıcılar</option>
            <option value="true">Sadece Adminler</option>
            <option value="false">Admin Olmayanlar</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                Kullanıcılar ({filteredUsers.length})
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    XP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Son Giriş
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatarUrl ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatarUrl}
                              alt={user.username}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName || user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username
                              }
                            </div>
                            {user.isAdmin && (
                              <div title="Admin">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </div>
                            )}
                            {!user.isEmailVerified && (
                              <div title="Email doğrulanmamış">
                                <Mail className="w-4 h-4 text-orange-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600 dark:text-red-400">İnaktif</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {user.xpPoints.toLocaleString()} XP
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatLastLogin(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`p-1 ${
                            user.isActive 
                              ? 'text-orange-600 hover:text-orange-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                          title={user.isActive ? 'Deaktif Et' : 'Aktif Et'}
                        >
                          {user.isActive ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {!user.isAdmin ? (
                          <button
                            onClick={() => handleMakeAdmin(user.id)}
                            className="p-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Admin Yap"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        ) : user.id !== AdminAuthService.getCurrentUser()?.id && (
                          <button
                            onClick={() => handleRemoveAdmin(user.id)}
                            className="p-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Admin Kaldır"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}

                        {user.id !== AdminAuthService.getCurrentUser()?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Kullanıcı Detayları
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {selectedUser.avatarUrl ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.username}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedUser.firstName || selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                        : selectedUser.username
                      }
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">@{selectedUser.username}</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Role</div>
                    <div className="text-gray-600 dark:text-gray-400">{selectedUser.role}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Durum</div>
                    <div className={selectedUser.isActive ? 'text-green-600' : 'text-red-600'}>
                      {selectedUser.isActive ? 'Aktif' : 'İnaktif'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">XP Puanları</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {selectedUser.xpPoints.toLocaleString()} XP
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Email Durumu</div>
                    <div className={selectedUser.isEmailVerified ? 'text-green-600' : 'text-orange-600'}>
                      {selectedUser.isEmailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Kayıt Tarihi</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatDate(selectedUser.createdAt)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Son Giriş</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatLastLogin(selectedUser.lastLoginAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
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

export default UsersManagement;