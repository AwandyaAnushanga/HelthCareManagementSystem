import axios from 'axios';

const SERVICES = {
  patient: process.env.REACT_APP_PATIENT_URL || 'http://localhost:3001',
  doctor: process.env.REACT_APP_DOCTOR_URL || 'http://localhost:3002',
  appointment: process.env.REACT_APP_APPOINTMENT_URL || 'http://localhost:3003',
  admin: process.env.REACT_APP_ADMIN_URL || 'http://localhost:3004',
  notification: process.env.REACT_APP_NOTIFICATION_URL || 'http://localhost:3005',
};

function createServiceApi(baseURL) {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const patientApi = createServiceApi(SERVICES.patient);
export const doctorApi = createServiceApi(SERVICES.doctor);
export const appointmentApi = createServiceApi(SERVICES.appointment);
export const adminApi = createServiceApi(SERVICES.admin);
export const notificationApi = createServiceApi(SERVICES.notification);

// Default export for backwards compatibility
export default patientApi;
