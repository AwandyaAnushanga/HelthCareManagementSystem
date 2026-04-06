import api from './api';

const doctorService = {
  register: (data) => api.post('/api/doctors/auth/register', data),
  login: (data) => api.post('/api/doctors/auth/login', data),
  getProfile: () => api.get('/api/doctors/me/profile'),
  updateProfile: (data) => api.put('/api/doctors/me/profile', data),
  getAllDoctors: (params) => api.get('/api/doctors', { params }),
  getDoctorById: (id) => api.get(`/api/doctors/${id}`),
  setAvailability: (data) => api.put('/api/doctors/me/availability', data),
  getAvailability: (doctorId) => api.get(`/api/doctors/${doctorId}/availability`),
};

export default doctorService;
