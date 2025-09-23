import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Crown, 
  Shield, 
  User, 
  Ban, 
  CheckCircle, 
  XCircle,
  Calendar,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiService as api } from '../services/api';
import { User as UserType, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface UserFilters {
  page: number;
  pageSize: number;
  searchTerm: string;
  role: 'all' | 'User' | 'Moderator' | 'Admin';
  status: 'all' | 'active' | 'banned' | 'suspended';
  sortBy: 'latest' | 'username' | 'email';
}

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    pageSize: 20,
    searchTerm: '',
    role: 'all',
    status: 'all',
    sortBy: 'latest'
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const canManageUsers = user?.role === UserRole.Admin;

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.admin.getUsers(filters),
    keepPreviousData: true,
    enabled: canManageUsers
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) => 
      api.admin.banUser(userId, reason),
    onSuccess: () => {
      toast.success('Kullanıcı yasaklandı');
      queryClient.invalidateQueries(['users']);
    },
    onError: () => {
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: (userId: number) => api.admin.unbanUser(userId),
    onSuccess: () => {
      toast.success('Kullanıcı yasağı kaldırıldı');
      queryClient.invalidateQueries(['users']);
    },
    onError: () => {
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => 
      api.admin.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('Kullanıcı rolü güncellendi');
      queryClient.invalidateQueries(['users']);
    },
    onError: () => {
      toast.error('İşlem sırasında bir hata oluştu');
    }
  });

  const users = usersResponse?.data || [];
  const totalPages = Math.ceil((usersResponse?.totalCount || 0) / filters.pageSize);

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: UserType) => u.id));
    }
  };

  const handleBanUser = (userId: number) => {
    const reason = window.prompt('Yasaklama sebebini girin:');
    if (reason) {
      banUserMutation.mutate({ userId, reason });
    }
  };

  const handleUnbanUser = (userId: number) => {
    if (window.confirm('Bu kullanıcının yasağını kaldırmak istediğinizden emin misiniz?')) {
      unbanUserMutation.mutate(userId);
    }
  };

  const handleRoleUpdate = (userId: number, newRole: string) => {
    if (window.confirm(`Bu kullanıcının rolünü ${newRole} olarak değiştirmek istediğinizden emin misiniz?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case UserRole.Moderator:
        return <Shield className="w-4 h-4 text-blue-600" />;
      case UserRole.User:
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case UserRole.Moderator:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.User:
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin:
        return 'Admin';
      case UserRole.Moderator:
        return 'Moderator';
      case UserRole.User:
      default:
        return 'User';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'banned':
        return 'text-red-600 dark:text-red-400';
      case 'suspended':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Yetki Gerekli
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sayfayı görüntülemek için admin yetkisine sahip olmalısınız.
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
                Kullanıcı Yönetimi
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {usersResponse?.totalCount || 0} kullanıcı bulundu
                {selectedUsers.length > 0 && ` • ${selectedUsers.length} seçili`}
              </p>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    selectedUsers.forEach(userId => handleBanUser(userId));
                    setSelectedUsers([]);
                  }}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Seçilileri Yasakla
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Kullanıcılarda ara..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="input pl-10 pr-4 w-full"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="input"
            >
              <option value="all">Tüm Roller</option>
              <option value="User">Kullanıcı</option>
              <option value="Moderator">Moderatör</option>
              <option value="Admin">Admin</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="banned">Yasaklı</option>
              <option value="suspended">Askıya Alınmış</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input"
            >
              <option value="latest">En Yeni</option>
              <option value="username">Kullanıcı Adı</option>
              <option value="email">E-posta</option>
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
              <p className="text-gray-600 dark:text-gray-400">Kullanıcılar yükleniyor...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Kullanıcı bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Seçilen kriterlere uygun kullanıcı bulunmamaktadır.
            </p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead className="bg-gray-50 dark:bg-dark-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Son Giriş
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
                    {users.map((userItem: UserType) => (
                      <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(userItem.id)}
                            onChange={() => handleSelectUser(userItem.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                              {userItem.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {userItem.firstName} {userItem.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                @{userItem.username}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {userItem.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userItem.role)}`}>
                              {getRoleIcon(userItem.role)}
                              <span className="ml-1">{getRoleDisplayName(userItem.role)}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center ${getStatusColor(userItem.status || 'active')}`}>
                            {userItem.status === 'banned' ? (
                              <XCircle className="w-4 h-4 mr-1" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            )}
                            <span className="text-sm font-medium capitalize">
                              {userItem.status || 'active'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(userItem.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {userItem.lastLoginAt ? formatDate(userItem.lastLoginAt) : 'Hiç'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/profile/${userItem.username}`}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Profili Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {userItem.role !== UserRole.Admin && (
                              <>
                                {userItem.status === 'banned' ? (
                                  <button
                                    onClick={() => handleUnbanUser(userItem.id)}
                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                    title="Yasağı Kaldır"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBanUser(userItem.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Yasakla"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                )}

                                <div className="relative">
                                  <select
                                    value={userItem.role}
                                    onChange={(e) => handleRoleUpdate(userItem.id, e.target.value)}
                                    className="text-xs border border-gray-200 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-800"
                                  >
                                    <option value="User">Kullanıcı</option>
                                    <option value="Moderator">Moderatör</option>
                                    {user?.role === UserRole.Admin && (
                                      <option value="Admin">Admin</option>
                                    )}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, filters.page - 2);
                    if (page > totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          page === filters.page
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;