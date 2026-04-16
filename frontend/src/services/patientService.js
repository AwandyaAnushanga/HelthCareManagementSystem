import { patientApi as api } from './api';

const patientService = {
  // Auth
  register: (data) => api.post('/api/patients/auth/register', data),
  login: (data) => api.post('/api/patients/auth/login', data),
  logout: () => api.post('/api/patients/auth/logout'),
  getMe: () => api.get('/api/patients/auth/me'),

  // Profile
  getProfile: () => api.get('/api/patients/profile'),
  updateProfile: (data) => api.put('/api/patients/profile', data),
  changePassword: (data) => api.put('/api/patients/change-password', data),
  deactivateAccount: () => api.put('/api/patients/deactivate'),

  // Medical history (legacy)
  getMedicalHistory: () => api.get('/api/patients/medical-history'),

  // Medical Records
  getMyRecords: (params) => api.get('/api/patients/medical-records/my-records', { params }),
  getRecordById: (id) => api.get(`/api/patients/medical-records/${id}`),
  createRecord: (data) => api.post('/api/patients/medical-records', data),
  updateRecord: (id, data) => api.put(`/api/patients/medical-records/${id}`, data),
  getDoctorRecords: (params) => api.get('/api/patients/medical-records/doctor-records', { params }),

  // Prescriptions
  getMyPrescriptions: (params) => api.get('/api/patients/prescriptions/my-prescriptions', { params }),
  getPrescriptionById: (id) => api.get(`/api/patients/prescriptions/${id}`),
  createPrescription: (data) => api.post('/api/patients/prescriptions', data),
  updatePrescription: (id, data) => api.put(`/api/patients/prescriptions/${id}`, data),
  cancelPrescription: (id) => api.put(`/api/patients/prescriptions/${id}/cancel`),
  getDoctorPrescriptions: (params) => api.get('/api/patients/prescriptions/doctor-prescriptions', { params }),
};

export default patientService;
