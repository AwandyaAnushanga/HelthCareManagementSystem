import api from './api';

const patientService = {
  register: (data) => api.post('/api/patients/auth/register', data),
  login: (data) => api.post('/api/patients/auth/login', data),
  getProfile: () => api.get('/api/patients/profile'),
  updateProfile: (data) => api.put('/api/patients/profile', data),
  getMedicalHistory: () => api.get('/api/patients/medical-history'),
};

export default patientService;
