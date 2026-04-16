import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService from '../../services/appointmentService';
import RescheduleModal from './RescheduleModal';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';

const AppointmentCard = ({ appointment, onUpdate }) => {
  const { user } = useAuth();
  const [showReschedule, setShowReschedule] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentService.updateStatus(appointment._id, {
        status: 'cancelled',
        reason: 'Cancelled by user',
      });
      toast.success('Appointment cancelled');
      onUpdate();
    } catch (err) {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleRescheduled = () => {
    setShowReschedule(false);
    onUpdate();
  };

  const isUpcoming = new Date(appointment.appointmentDate) > new Date()
    && ['pending', 'confirmed'].includes(appointment.status);

  return (
    <>
      <div className="appointment-card">
        <div className="apt-header">
          <h3>
            {user.role === 'patient'
              ? `Dr. ${appointment.doctorName}`
              : appointment.patientName}
          </h3>
          <span className={`status status-${appointment.status}`}>{appointment.status}</span>
        </div>
        <p>{formatDate(appointment.appointmentDate)} &middot; {appointment.timeSlot} &middot; {appointment.type}</p>
        <p><strong>Reason:</strong> {appointment.reason}</p>
        {appointment.priority !== 'normal' && (
          <span className={`tag tag-${appointment.priority === 'emergency' ? 'danger' : 'warning'}`}>{appointment.priority}</span>
        )}
        {appointment.videoConsultation?.videoLink && (
          <a href={appointment.videoConsultation.videoLink} target="_blank" rel="noopener noreferrer" className="btn-video">
            Join Video Consultation
          </a>
        )}

        <div className="action-buttons">
          <Link to={`/appointments/${appointment._id}`} className="btn btn-secondary btn-sm">Details</Link>
          {isUpcoming && (
            <>
              <button onClick={() => setShowReschedule(true)} className="btn btn-info btn-sm">Reschedule</button>
              <button onClick={handleCancel} className="btn btn-danger btn-sm">Cancel</button>
            </>
          )}
        </div>
      </div>

      {showReschedule && (
        <RescheduleModal
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onRescheduled={handleRescheduled}
        />
      )}
    </>
  );
};

export default AppointmentCard;
