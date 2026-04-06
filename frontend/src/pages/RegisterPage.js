import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import patientService from '../services/patientService';
import doctorService from '../services/doctorService';

const RegisterPage = () => {
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', dateOfBirth: '', gender: 'male',
    specialization: '', consultationFee: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const service = role === 'patient' ? patientService : doctorService;
      const { data } = await service.register(form);
      const userData = data.patient || data.doctor;
      login({ ...userData, role }, data.token);
      toast.success('Registration successful');
      navigate(`/${role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Register</h2>
      <div className="role-toggle">
        <button className={role === 'patient' ? 'active' : ''} onClick={() => setRole('patient')}>Patient</button>
        <button className={role === 'doctor' ? 'active' : ''} onClick={() => setRole('doctor')}>Doctor</button>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />

        {role === 'patient' && (
          <>
            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </>
        )}

        {role === 'doctor' && (
          <>
            <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleChange} required />
            <input name="consultationFee" type="number" placeholder="Consultation Fee" value={form.consultationFee} onChange={handleChange} required />
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
