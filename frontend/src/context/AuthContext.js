import React, { createContext, useContext, useState, useEffect } from 'react';
import { patientApi, doctorApi, adminApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    // Call backend logout to blacklist token
    try {
      const role = user?.role;
      const logoutMap = {
        patient: () => patientApi.post('/api/patients/auth/logout'),
        doctor: () => doctorApi.post('/api/doctors/auth/logout'),
        admin: () => adminApi.post('/api/admin/auth/logout'),
      };
      if (role && logoutMap[role]) {
        await logoutMap[role]();
      }
    } catch {
      // Proceed with local logout even if server call fails
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
