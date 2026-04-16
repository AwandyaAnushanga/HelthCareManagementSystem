import { notificationApi as api } from './api';

const notificationService = {
  // User endpoints
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  archive: (id) => api.put(`/api/notifications/${id}/archive`),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),

  // Admin endpoints
  send: (data) => api.post('/api/notifications/send', data),
  getAll: (params) => api.get('/api/notifications/all', { params }),
  getStats: () => api.get('/api/notifications/stats'),

  // Template management (admin)
  getTemplates: (params) => api.get('/api/notifications/templates', { params }),
  getTemplateById: (id) => api.get(`/api/notifications/templates/${id}`),
  getTemplateByType: (type) => api.get(`/api/notifications/templates/type/${type}`),
  createTemplate: (data) => api.post('/api/notifications/templates', data),
  updateTemplate: (id, data) => api.put(`/api/notifications/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/api/notifications/templates/${id}`),
  previewTemplate: (id, variables) => api.post(`/api/notifications/templates/${id}/preview`, { variables }),
};

export default notificationService;
