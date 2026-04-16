import { doctorApi as api } from './api';

const doctorService = {
  // Auth
  register: (data) => api.post('/api/doctors/auth/register', data),
  login: (data) => api.post('/api/doctors/auth/login', data),
  logout: () => api.post('/api/doctors/auth/logout'),
  getMe: () => api.get('/api/doctors/auth/me'),

  // Profile
  getProfile: () => api.get('/api/doctors/me/profile'),
  updateProfile: (data) => api.put('/api/doctors/me/profile', data),
  changePassword: (data) => api.put('/api/doctors/me/change-password', data),

  // Public browsing
  getAllDoctors: (params) => api.get('/api/doctors', { params }),
  getDoctorById: (id) => api.get(`/api/doctors/${id}`),

  // Availability
  getAvailability: (doctorId) => api.get(`/api/doctors/${doctorId}/availability`),
  getSlots: (doctorId, date) => api.get(`/api/doctors/${doctorId}/slots`, { params: { date } }),
  setAvailability: (data) => api.put('/api/doctors/me/availability', data),
  deleteAvailability: (dayOfWeek) => api.delete(`/api/doctors/me/availability/${dayOfWeek}`),

  // Date overrides
  addOverride: (data) => api.post('/api/doctors/me/availability/overrides', data),
  removeOverride: (overrideId) => api.delete(`/api/doctors/me/availability/overrides/${overrideId}`),
};

export default doctorService;
