import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';
import SlotPicker from '../components/appointments/SlotPicker';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [type, setType] = useState('in-person');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const params = { limit: 50 };
        if (search) params.specialization = search;
        const { data } = await doctorService.getAllDoctors(params);
        setDoctors(data.doctors || []);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, [search]);

  const handleSlotSelect = (date, slot) => {
    setAppointmentDate(date);
    setTimeSlot(slot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return toast.error('Please select a doctor');
    if (!appointmentDate || !timeSlot) return toast.error('Please select a date and time slot');
    setLoading(true);

    try {
      await appointmentService.book({
        doctorId: selectedDoctor._id,
        doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        doctorEmail: selectedDoctor.email,
        specialization: selectedDoctor.specialization,
        consultationFee: selectedDoctor.consultationFee,
        appointmentDate,
        timeSlot,
        type,
        reason,
        symptoms: symptoms ? symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      toast.success('Appointment booked successfully!');
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

      {/* Step 1: Select Doctor */}
      <div className="booking-step">
        <h2>1. Select a Doctor</h2>
        <input
          type="text"
          placeholder="Filter by specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="doctor-grid">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className={`doctor-card ${selectedDoctor?._id === doc._id ? 'selected' : ''}`}
              onClick={() => { setSelectedDoctor(doc); setTimeSlot(''); }}
            >
              <h3>Dr. {doc.firstName} {doc.lastName}</h3>
              <p className="doc-spec">{doc.specialization}</p>
              <p>Fee: ${doc.consultationFee}</p>
              {doc.rating?.average > 0 && (
                <p className="doc-rating">{doc.rating.average.toFixed(1)} ({doc.rating.count} reviews)</p>
              )}
            </div>
          ))}
          {doctors.length === 0 && <p className="empty-state">No doctors found.</p>}
        </div>
      </div>

      {/* Step 2: Pick slot */}
      {selectedDoctor && (
        <div className="booking-step">
          <h2>2. Choose Date & Time</h2>
          <SlotPicker
            doctorId={selectedDoctor._id}
            onSlotSelect={handleSlotSelect}
            selectedSlot={timeSlot}
          />
        </div>
      )}

      {/* Step 3: Details */}
      {selectedDoctor && timeSlot && (
        <div className="booking-step">
          <h2>3. Appointment Details</h2>
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="booking-summary">
              <p><strong>Doctor:</strong> Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
              <p><strong>Date:</strong> {appointmentDate}</p>
              <p><strong>Time:</strong> {timeSlot}</p>
              <p><strong>Fee:</strong> ${selectedDoctor.consultationFee}</p>
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="in-person">In-Person</option>
              <option value="video">Video Consultation</option>
            </select>

            <textarea
              placeholder="Reason for visit *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Symptoms (comma separated, optional)"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
