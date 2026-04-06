import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [form, setForm] = useState({
    appointmentDate: '', timeSlot: '', type: 'in-person', reason: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await doctorService.getAllDoctors({ limit: 50 });
        setDoctors(data.doctors);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return toast.error('Please select a doctor');
    setLoading(true);

    try {
      await appointmentService.book({
        ...form,
        doctorId: selectedDoctor._id,
        doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        doctorEmail: selectedDoctor.email,
        specialization: selectedDoctor.specialization,
        consultationFee: selectedDoctor.consultationFee,
      });
      toast.success('Appointment booked successfully');
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-appointment">
      <h1>Book Appointment</h1>

      <div className="doctor-selection">
        <h2>Select Doctor</h2>
        <div className="doctor-grid">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className={`doctor-card ${selectedDoctor?._id === doc._id ? 'selected' : ''}`}
              onClick={() => setSelectedDoctor(doc)}
            >
              <h3>Dr. {doc.firstName} {doc.lastName}</h3>
              <p>{doc.specialization}</p>
              <p>Fee: ${doc.consultationFee}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedDoctor && (
        <form onSubmit={handleSubmit} className="booking-form">
          <input
            type="date"
            value={form.appointmentDate}
            onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Time slot (e.g., 09:00-09:30)"
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
            required
          />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="in-person">In-Person</option>
            <option value="video">Video Consultation</option>
          </select>
          <textarea
            placeholder="Reason for visit"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      )}
    </div>
  );
};

export default BookAppointment;
