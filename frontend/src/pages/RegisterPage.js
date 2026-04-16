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
  const [qualifications, setQualifications] = useState([
    { degree: '', institution: '', year: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleQualChange = (index, e) => {
    const updated = [...qualifications];
    updated[index][e.target.name] = e.target.value;
    setQualifications(updated);
  };

  const addQualification = () => setQualifications([...qualifications, { degree: '', institution: '', year: '' }]);

  const removeQualification = (index) => {
    if (qualifications.length > 1) setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = role === 'doctor' ? { ...form, qualifications } : form;
      const service = role === 'patient' ? patientService : doctorService;
      const { data } = await service.register(payload);
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
            <div className="qualifications-section">
              <label><strong>Qualifications</strong></label>
              {qualifications.map((q, i) => (
                <div key={i} className="qualification-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input name="degree" placeholder="Degree (e.g. MBBS)" value={q.degree} onChange={(e) => handleQualChange(i, e)} required />
                  <input name="institution" placeholder="Institution" value={q.institution} onChange={(e) => handleQualChange(i, e)} required />
                  <input name="year" type="number" placeholder="Year" value={q.year} onChange={(e) => handleQualChange(i, e)} required min="1950" max={new Date().getFullYear()} />
                  {qualifications.length > 1 && (
                    <button type="button" onClick={() => removeQualification(i)} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 10px' }}>X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addQualification} style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>+ Add Qualification</button>
            </div>
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
