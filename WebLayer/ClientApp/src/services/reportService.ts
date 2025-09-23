import { api } from './api';

export enum ReportableType {
  Comment = 1,
  Guide = 2,
  BlogPost = 3,
  ForumTopic = 4,
  User = 5
}

export enum ReportType {
  Spam = 1,
  InappropriateContent = 2,
  Harassment = 3,
  CopyrightViolation = 4,
  Misinformation = 5,
  FakeProfile = 6,
  OffensiveLanguage = 7,
  Other = 8
}

export interface CreateReportDto {
  reportableType: ReportableType;
  reportableEntityId: number;
  reportType: ReportType;
  reason: string;
  description?: string;
}

export enum ReportStatus {
  Pending = 1,
  UnderReview = 2,
  Approved = 3,
  Rejected = 4,
  Resolved = 5
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface ReportDto {
  id: number;
  reporterId: number;
  reporter?: UserDto;
  reportableType: ReportableType;
  reportableEntityId: number;
  reportType: ReportType;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewedByUserId?: number;
  reviewedByUser?: UserDto;
  reviewNotes?: string;
  createdDate: string;
  reviewedDate?: string;
  evidence?: string;
}

export interface UpdateReportDto {
  status?: ReportStatus;
  reviewNotes?: string;
  adminNote?: string;
}

export interface GetReportsResponse {
  data: ReportDto[];
  totalCount: number;
}

export const reportService = {
  createReport: async (reportData: CreateReportDto): Promise<ReportDto> => {
    const response = await api.post('/reports', reportData);
    return response.data.data;
  },

  getMyReports: async (): Promise<ReportDto[]> => {
    const response = await api.get('/reports/my-reports');
    return response.data.data;
  },

  checkIfReported: async (reportableType: ReportableType, entityId: number): Promise<boolean> => {
    const response = await api.get(`/reports/check/${reportableType}/${entityId}`);
    return response.data.data;
  },

  // Admin endpoints
  getAllReports: async (params?: {
    searchTerm?: string;
    status?: string;
    reportType?: string;
    reportableType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<GetReportsResponse> => {
    const response = await api.get('/reports', { params });
    return {
      data: response.data.data,
      totalCount: response.data.totalCount
    };
  },

  getReportById: async (id: number): Promise<ReportDto> => {
    const response = await api.get(`/reports/${id}`);
    return response.data.data;
  },

  updateReport: async (id: number, updateData: UpdateReportDto): Promise<ReportDto> => {
    const response = await api.put(`/reports/${id}`, updateData);
    return response.data.data;
  },

  updateReportStatus: async (id: number, status: ReportStatus): Promise<ReportDto> => {
    const response = await api.put(`/reports/${id}/status`, { status });
    return response.data.data;
  },

  approveReport: async (id: number, notes?: string): Promise<void> => {
    await api.post(`/reports/${id}/approve`, { notes: notes || '' });
  },

  rejectReport: async (id: number, notes?: string): Promise<void> => {
    await api.post(`/reports/${id}/reject`, { notes: notes || '' });
  },

  getPendingReports: async (): Promise<ReportDto[]> => {
    const response = await api.get('/reports/pending');
    return response.data.data;
  },

  getReportsByStatus: async (status: ReportStatus): Promise<ReportDto[]> => {
    const response = await api.get(`/reports/status/${status}`);
    return response.data.data;
  },

  getRecentReports: async (count: number = 10): Promise<ReportDto[]> => {
    const response = await api.get(`/reports/recent/${count}`);
    return response.data.data;
  },

  getReportsForEntity: async (reportableType: ReportableType, entityId: number): Promise<ReportDto[]> => {
    const response = await api.get(`/reports/entity/${reportableType}/${entityId}`);
    return response.data.data;
  }
};

export default reportService;