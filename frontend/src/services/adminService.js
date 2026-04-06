import api from './api';

const adminService = {
  login: (data) => api.post('/api/admin/auth/login', data),
  verifyDoctor: (doctorId) => api.put(`/api/admin/verify-doctor/${doctorId}`),
  getAnalytics: () => api.get('/api/admin/analytics'),
  getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
  getDoctors: (params) => api.get('/api/admin/doctors', { params }),
  getPatients: (params) => api.get('/api/admin/patients', { params }),
};

export default adminService;
