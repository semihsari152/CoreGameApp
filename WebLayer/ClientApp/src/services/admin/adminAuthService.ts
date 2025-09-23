import api from '../api';
import axios from 'axios';
import { authAPI } from '../api'; // API functions'ları kullanacağız
import Cookies from 'js-cookie';

// Get API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5124/api';

// Admin Auth Types
export interface AdminPermissionInfo {
  id: number;
  name: string;
  key: string;
  category: string;
  grantedAt: string;
  grantedBy?: string;
}

export interface AdminUserInfo {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  permissions: string[];
  permissionDetails: AdminPermissionInfo[];
}

export class AdminAuthService {
  private static readonly ADMIN_USER_KEY = 'adminUser';

  // Admin login - uses regular login but verifies admin status
  static async login(email: string, password: string): Promise<AdminUserInfo> {
    try {
      // Use regular login API
      const authResponse = await authAPI.login({ email, password });
      
      // Store tokens in localStorage as well for admin auth
      localStorage.setItem('accessToken', authResponse.accessToken);
      localStorage.setItem('refreshToken', authResponse.refreshToken);
      
      // Verify admin status
      const adminUser = await this.verifyAdminStatus();
      
      // Store admin user info
      localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(adminUser));
      
      return adminUser;
    } catch (error: any) {
      // Clear any tokens on failure
      this.clearAdminData();
      throw new Error(error.message || 'Admin login failed');
    }
  }

  // Verify admin status with current token
  static async verifyAdminStatus(): Promise<AdminUserInfo> {
    try {
      const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
      const response = await axios.post<AdminUserInfo>('/admin/auth/verify', {}, {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5124/api',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update stored user info
      localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      this.clearAdminData();
      throw new Error(error.response?.data?.message || 'Admin verification failed');
    }
  }

  // Logout admin user
  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
      await axios.post('/admin/auth/logout', {}, {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5124/api',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      // Clear admin data and regular logout
      this.clearAdminData();
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    }
  }

  // Get stored admin user
  static getCurrentUser(): AdminUserInfo | null {
    const userStr = localStorage.getItem(this.ADMIN_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if admin is logged in
  static isLoggedIn(): boolean {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    const adminUser = this.getCurrentUser();
    return !!token && adminUser !== null && adminUser.isAdmin;
  }

  // Check if user has specific admin permission
  static hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  // Check if user can manage users
  static canManageUsers(): boolean {
    return this.hasPermission('users.manage');
  }

  // Check if user can manage content
  static canManageContent(): boolean {
    return this.hasPermission('content.manage');
  }

  // Check if user can manage system
  static canManageSystem(): boolean {
    return this.hasPermission('system.manage');
  }

  // Check if user can manage admins
  static canManageAdmins(): boolean {
    return this.hasPermission('admin.manage');
  }

  // Check if user can manage reports
  static canManageReports(): boolean {
    return this.hasPermission('reports.manage');
  }

  // Clear admin data
  static clearAdminData(): void {
    localStorage.removeItem(this.ADMIN_USER_KEY);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get admin user's full name
  static getFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.username;
  }

  // Initialize admin auth (check if current user is admin)
  static async initialize(): Promise<boolean> {
    try {
      if (!this.isLoggedIn()) {
        this.clearAdminData();
        return false;
      }

      // Try to verify admin status
      await this.verifyAdminStatus();
      return true;
    } catch (error) {
      this.clearAdminData();
      return false;
    }
  }

  // Check admin permissions without API call
  static checkPermissions(requiredPermissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.isAdmin) return false;
    
    return requiredPermissions.every(permission => user.permissions.includes(permission));
  }

  // Get all users (for admin user management)
  static async getAllUsers(): Promise<any[]> {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (!token) throw new Error('Token bulunamadı');

    const response = await fetch(`${API_BASE_URL}/Users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Kullanıcılar alınamadı');
    }

    const data = await response.json();
    return data;
  }

  // Toggle user status
  static async toggleUserStatus(userId: number): Promise<void> {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (!token) throw new Error('Token bulunamadı');

    const response = await fetch(`${API_BASE_URL}/Users/${userId}/toggle-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Kullanıcı durumu güncellenemedi');
    }
  }

  // Delete user
  static async deleteUser(userId: number): Promise<void> {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (!token) throw new Error('Token bulunamadı');

    const response = await fetch(`${API_BASE_URL}/Users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Kullanıcı silinemedi');
    }
  }

  // Make user admin
  static async makeUserAdmin(userId: number): Promise<void> {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (!token) throw new Error('Token bulunamadı');

    const response = await fetch(`${API_BASE_URL}/Users/${userId}/make-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Admin yetkisi verilemedi');
    }
  }

  // Remove admin from user
  static async removeUserAdmin(userId: number): Promise<void> {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (!token) throw new Error('Token bulunamadı');

    const response = await fetch(`${API_BASE_URL}/Users/${userId}/remove-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Admin yetkisi kaldırılamadı');
    }
  }
}