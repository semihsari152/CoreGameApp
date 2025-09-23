import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  Crown, 
  UserCheck, 
  Settings,
  Eye,
  ChevronRight,
  Filter,
  Badge,
  Calendar,
  User,
  X,
  Check,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdDate: string;
  lastLoginDate?: string;
  profilePictureUrl?: string;
}

interface Permission {
  id: number;
  name: string;
  key: string;
  category: string;
  description: string;
  isActive: boolean;
  order: number;
}

interface UserPermission {
  id: number;
  userId: number;
  adminPermissionId: number;
  permission: Permission;
  grantedAt: string;
  grantedByUserId: number;
  grantedByUser: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
  notes?: string;
  isActive: boolean;
}

interface UserPermissionDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const UserPermissionManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadPrivilegedUsers();
  }, []);

  const loadPrivilegedUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Get users with Admin or Moderator roles
      const response = await fetch('http://localhost:5124/api/admin/privileged-users?roles=Admin,Moderator', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Yetkili kullanıcılar alınamadı');
      }

      const result = await response.json();
      // Sort users: Admin first, then Moderator
      const sortedUsers = (result.data || []).sort((a: User, b: User) => {
        if (a.role === 'Admin' && b.role === 'Moderator') return -1;
        if (a.role === 'Moderator' && b.role === 'Admin') return 1;
        return a.username.localeCompare(b.username);
      });
      setUsers(sortedUsers);
    } catch (error: any) {
      toast.error(error.message || 'Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setShowDetailModal(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-4 h-4 text-red-500" />;
      case 'Moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kullanıcı Yetki Yönetimi
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Admin ve Moderatör yetkilerini yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tüm Yetkiler</option>
            <option value="Admin">Sadece Admin</option>
            <option value="Moderator">Sadece Moderatör</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Kullanıcı bulunamadı
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Arama kriterlerinize uygun yetkili kullanıcı bulunamadı
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => openUserDetail(user)}
            >
              {/* User Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1">
                      {getRoleIcon(user.role)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>

              {/* Role Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1">{user.role}</span>
                </span>
              </div>

              {/* User Info */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <span>📧</span>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Kayıt: {new Date(user.createdDate).toLocaleDateString('tr-TR')}</span>
                </div>
                {user.lastLoginDate && (
                  <div className="flex items-center space-x-1">
                    <span>🕒</span>
                    <span>Son giriş: {new Date(user.lastLoginDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              {/* Action Hint */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Yetkileri görüntüle ve düzenle
                  </span>
                  <Eye className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Permission Detail Modal */}
      {showDetailModal && selectedUser && (
        <UserPermissionDetailModal
          user={selectedUser}
          isOpen={showDetailModal}
          onClose={closeUserDetail}
          onUpdate={loadPrivilegedUsers}
        />
      )}
    </div>
  );
};

// User Permission Detail Modal Component
const UserPermissionDetailModal: React.FC<UserPermissionDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [permissionCategories, setPermissionCategories] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setIsEditing(false); // Reset to view mode when opening modal
      loadPermissions();
      loadUserPermissions();
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    try {
      console.log('loadPermissions called');
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5124/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Permissions API response status:', response.status);

      if (!response.ok) {
        throw new Error('Yetkiler alınamadı');
      }

      const result = await response.json();
      console.log('Permissions API result:', result);
      const perms = result.Permissions || result.permissions || result.data || [];
      console.log('Processed permissions:', perms);
      setPermissions(perms);
      
      // Get unique categories
      const categories = [...new Set(perms.map((p: Permission) => p.category))] as string[];
      setPermissionCategories(categories);
      console.log('Permission categories set:', categories);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      toast.error(error.message || 'Yetkiler yüklenirken hata oluştu');
    }
  };

  const loadUserPermissions = async () => {
    try {
      console.log('loadUserPermissions called for user:', user.id);
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5124/api/admin/users/${user.id}/admin-permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('User permissions response status:', response.status);

      if (!response.ok) {
        throw new Error('Kullanıcı yetkileri alınamadı');
      }

      const result = await response.json();
      console.log('User permissions response:', result);
      const userPerms = result.data || [];
      console.log('Processed user permissions:', userPerms);
      setUserPermissions(userPerms);
      
      // Set selected permissions
      const selectedIds = new Set(userPerms.map((up: UserPermission) => up.adminPermissionId)) as Set<number>;
      console.log('Selected permission IDs:', [...selectedIds]);
      setSelectedPermissions(selectedIds);
    } catch (error: any) {
      console.error('Error loading user permissions:', error);
      toast.error(error.message || 'Kullanıcı yetkileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const savePermissions = async () => {
    try {
      console.log('Save permissions called');
      setSaving(true);
      const token = localStorage.getItem('accessToken');

      // Use batch update API
      const response = await fetch(`http://localhost:5124/api/admin/users/${user.id}/admin-permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissionIds: [...selectedPermissions]
        }),
      });

      console.log('Update permissions response status:', response.status);
      const responseText = await response.text();
      console.log('Update permissions response text:', responseText);
      
      if (!response.ok) {
        throw new Error('Yetkileri güncelleme sırasında hata oluştu');
      }

      toast.success('Kullanıcı yetkileri başarıyla güncellendi');
      onUpdate();
      loadUserPermissions(); // Reload to get fresh data
      setIsEditing(false); // Exit editing mode
    } catch (error: any) {
      toast.error(error.message || 'Yetkiler güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yetki {isEditing ? 'Düzenleme' : 'Görüntüleme'} - @{user.username}
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => {
                  console.log('Edit button clicked');
                  if (permissions.length === 0) {
                    console.log('Loading permissions for edit mode');
                    loadPermissions();
                  }
                  setIsEditing(true);
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Düzenle</span>
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {isEditing ? (
                // Editing Mode - Checkboxes
                <>
                  {(() => {
                    console.log('Edit mode - Permissions:', permissions);
                    console.log('Edit mode - Permissions length:', permissions.length);
                    console.log('Edit mode - Categories:', [...new Set(permissions.map(p => p.category).filter(Boolean))]);
                    console.log('Edit mode - Selected permissions:', selectedPermissions);
                    return null;
                  })()}
                  {[...new Set(permissions.map(p => p.category).filter(Boolean))].map((category) => {
                  const categoryPermissions = permissions.filter(p => p.category === category && p.isActive);
                  
                  if (categoryPermissions.length === 0) return null;

                  return (
                    <div key={category} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Badge className="w-5 h-5 mr-2 text-blue-500" />
                        {category}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => {
                          const isSelected = selectedPermissions.has(permission.id);
                          
                          return (
                            <div
                              key={permission.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                              }`}
                              onClick={() => togglePermission(permission.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {isSelected ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {permission.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {permission.description}
                                  </p>
                                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                                    {permission.key}
                                  </code>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </>
              ) : (
                // View Mode - Display active permissions only
                <div className="space-y-6">
                    {userPermissions.length === 0 ? (
                    <div className="text-center py-12">
                      <Badge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Hiç aktif yetkisi bulunmuyor
                      </p>
                    </div>
                  ) : (
                    // Get unique categories from user permissions
                    [...new Set(userPermissions.map(up => up.permission?.category).filter(Boolean))].map((category) => {
                      const categoryUserPermissions = userPermissions.filter(up => 
                        up.permission && up.permission.category === category
                      );
                      
                      if (categoryUserPermissions.length === 0) return null;

                      return (
                        <div key={category} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Badge className="w-5 h-5 mr-2 text-green-500" />
                            {category}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({categoryUserPermissions.length} yetki)
                            </span>
                          </h3>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {categoryUserPermissions.map((userPerm) => (
                              <div
                                key={userPerm.id}
                                className="p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg"
                              >
                                <div className="flex items-start space-x-3">
                                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {userPerm.permission.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {userPerm.permission.description}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-2 mt-2">
                                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {userPerm.permission.key}
                                      </code>
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        ✓ {new Date(userPerm.grantedAt).toLocaleDateString('tr-TR')} tarihinde verildi
                                      </span>
                                      {userPerm.grantedByUser && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Veren: {userPerm.grantedByUser.firstName && userPerm.grantedByUser.lastName 
                                            ? `${userPerm.grantedByUser.firstName} ${userPerm.grantedByUser.lastName}` 
                                            : userPerm.grantedByUser.username}
                                        </span>
                                      )}
                                    </div>
                                    {userPerm.notes && (
                                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
                                        <strong>Not:</strong> {userPerm.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {isEditing ? (
            <>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>
                  {selectedPermissions.size} yetki seçildi
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </>
              )}
            </button>
              </div>
            </>
          ) : (
            // View Mode Footer
            <>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span>
                  {userPermissions.length} aktif yetki görüntüleniyor
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    onClose();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Kapat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissionManagement;