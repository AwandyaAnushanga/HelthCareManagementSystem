import api from './api';

const appointmentService = {
  book: (data) => api.post('/api/appointments/book', data),
  getPatientAppointments: (params) => api.get('/api/appointments/my-appointments', { params }),
  getDoctorAppointments: (params) => api.get('/api/appointments/doctor-appointments', { params }),
  getById: (id) => api.get(`/api/appointments/${id}`),
  updateStatus: (id, data) => api.put(`/api/appointments/${id}/status`, data),
  addVideoLink: (id, data) => api.put(`/api/appointments/${id}/video-link`, data),
};

export default appointmentService;
