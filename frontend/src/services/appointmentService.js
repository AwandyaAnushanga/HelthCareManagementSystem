import { appointmentApi as api } from './api';

const appointmentService = {
  // Patient
  book: (data) => api.post('/api/appointments/book', data),
  getPatientAppointments: (params) => api.get('/api/appointments/my-appointments', { params }),

  // Doctor
  getDoctorAppointments: (params) => api.get('/api/appointments/doctor-appointments', { params }),
  addVideoLink: (id, data) => api.put(`/api/appointments/${id}/video-link`, data),
  addDoctorNotes: (id, data) => api.put(`/api/appointments/${id}/doctor-notes`, data),

  // Shared
  getById: (id) => api.get(`/api/appointments/${id}`),
  updateStatus: (id, data) => api.put(`/api/appointments/${id}/status`, data),
  reschedule: (id, data) => api.post(`/api/appointments/${id}/reschedule`, data),

  // Admin
  getAllAppointments: (params) => api.get('/api/appointments/all', { params }),
  getStats: () => api.get('/api/appointments/stats'),
};

export default appointmentService;
