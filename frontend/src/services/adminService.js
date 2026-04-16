import { adminApi as api } from './api';

const adminService = {
  // Auth
  login: (data) => api.post('/api/admin/auth/login', data),
  logout: () => api.post('/api/admin/auth/logout'),
  getMe: () => api.get('/api/admin/auth/me'),

  // Doctor management
  verifyDoctor: (doctorId) => api.put(`/api/admin/verify-doctor/${doctorId}`),
  rejectDoctor: (doctorId, data) => api.put(`/api/admin/reject-doctor/${doctorId}`, data),
  getDoctors: (params) => api.get('/api/admin/doctors', { params }),

  // Patient management
  getPatients: (params) => api.get('/api/admin/patients', { params }),

  // Admin management
  getAllAdmins: (params) => api.get('/api/admin/admins', { params }),
  updateAdmin: (id, data) => api.put(`/api/admin/admins/${id}`, data),
  deactivateAdmin: (id) => api.put(`/api/admin/admins/${id}/deactivate`),
  reactivateAdmin: (id) => api.put(`/api/admin/admins/${id}/reactivate`),

  // Analytics & Audit
  getAnalytics: () => api.get('/api/admin/analytics'),
  getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
  getAuditStats: (params) => api.get('/api/admin/audit-stats', { params }),
};

export default adminService;
