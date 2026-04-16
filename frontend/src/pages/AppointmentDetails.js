import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService from '../services/appointmentService';
import VideoPlayer from '../components/video/VideoPlayer';
import RescheduleModal from '../components/appointments/RescheduleModal';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatDate';

const AppointmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data } = await appointmentService.getById(id);
        setAppointment(data);
      } catch (err) {
        console.error('Failed to load appointment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentService.updateStatus(id, { status: 'cancelled', reason: 'Cancelled by user' });
      toast.success('Appointment cancelled');
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const handleRescheduled = () => {
    setShowReschedule(false);
    navigate(`/${user.role}/dashboard`);
    toast.success('Appointment rescheduled');
  };

  if (loading) return <div className="loading">Loading appointment...</div>;
  if (!appointment) return <p className="empty-state">Appointment not found.</p>;

  const isUpcoming = new Date(appointment.appointmentDate) > new Date()
    && ['pending', 'confirmed'].includes(appointment.status);

  return (
    <div className="appointment-details">
      <h1>Appointment Details</h1>
      <div className="detail-card">
        <div className="detail-grid">
          <p><strong>Appointment #:</strong> {appointment.appointmentNumber || 'N/A'}</p>
          <p><strong>Doctor:</strong> Dr. {appointment.doctorName}</p>
          <p><strong>Patient:</strong> {appointment.patientName}</p>
          <p><strong>Specialization:</strong> {appointment.specialization || 'N/A'}</p>
          <p><strong>Date:</strong> {formatDate(appointment.appointmentDate)}</p>
          <p><strong>Time:</strong> {appointment.timeSlot}</p>
          <p><strong>Duration:</strong> {appointment.duration} min</p>
          <p><strong>Type:</strong> {appointment.type}</p>
          <p><strong>Status:</strong> <span className={`status status-${appointment.status}`}>{appointment.status}</span></p>
          <p><strong>Priority:</strong> {appointment.priority}</p>
          <p><strong>Fee:</strong> {appointment.consultationFee ? `$${appointment.consultationFee}` : 'N/A'}</p>
          <p><strong>Payment:</strong> {appointment.paymentStatus}</p>
        </div>

        <h3>Reason for Visit</h3>
        <p>{appointment.reason}</p>

        {appointment.symptoms?.length > 0 && (
          <>
            <h3>Symptoms</h3>
            <div className="tag-list">
              {appointment.symptoms.map((s, i) => <span key={i} className="tag">{s}</span>)}
            </div>
          </>
        )}

        {appointment.patientNotes && (
          <>
            <h3>Patient Notes</h3>
            <p>{appointment.patientNotes}</p>
          </>
        )}

        {appointment.doctorNotes && (
          <>
            <h3>Doctor Notes</h3>
            <p>{appointment.doctorNotes}</p>
          </>
        )}

        {appointment.statusHistory?.length > 0 && (
          <>
            <h3>Status History</h3>
            <div className="status-history">
              {appointment.statusHistory.map((entry, i) => (
                <div key={i} className="history-entry">
                  <span className={`status status-${entry.status}`}>{entry.status}</span>
                  <span>{formatDateTime(entry.changedAt)}</span>
                  {entry.reason && <span className="history-reason">{entry.reason}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {isUpcoming && (
          <div className="action-buttons" style={{ marginTop: '1.5rem' }}>
            <button onClick={() => setShowReschedule(true)} className="btn btn-info">Reschedule</button>
            <button onClick={handleCancel} className="btn btn-danger">Cancel Appointment</button>
          </div>
        )}
      </div>

      {appointment.videoConsultation?.videoLink && (
        <VideoPlayer videoLink={appointment.videoConsultation.videoLink} />
      )}

      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onRescheduled={handleRescheduled}
        />
      )}
    </div>
  );
};

export default AppointmentDetails;
