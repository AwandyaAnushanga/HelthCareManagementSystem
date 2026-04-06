import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookAppointment from './pages/BookAppointment';
import AppointmentDetails from './pages/AppointmentDetails';
import NotFoundPage from './pages/NotFoundPage';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import Navbar from './components/common/Navbar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/patient/dashboard" element={
              <PrivateRoute role="patient"><PatientDashboard /></PrivateRoute>
            } />
            <Route path="/doctor/dashboard" element={
              <PrivateRoute role="doctor"><DoctorDashboard /></PrivateRoute>
            } />
            <Route path="/admin/dashboard" element={
              <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
            } />

            <Route path="/book-appointment" element={
              <PrivateRoute role="patient"><BookAppointment /></PrivateRoute>
            } />
            <Route path="/appointments/:id" element={
              <PrivateRoute><AppointmentDetails /></PrivateRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
