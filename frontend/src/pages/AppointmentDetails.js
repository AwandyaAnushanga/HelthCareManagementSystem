import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import appointmentService from '../services/appointmentService';
import VideoPlayer from '../components/video/VideoPlayer';

const AppointmentDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (!appointment) return <p>Appointment not found.</p>;

  return (
    <div className="appointment-details">
      <h1>Appointment Details</h1>
      <div className="detail-card">
        <p><strong>Doctor:</strong> Dr. {appointment.doctorName}</p>
        <p><strong>Patient:</strong> {appointment.patientName}</p>
        <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> {appointment.timeSlot}</p>
        <p><strong>Type:</strong> {appointment.type}</p>
        <p><strong>Status:</strong> <span className={`status status-${appointment.status}`}>{appointment.status}</span></p>
        <p><strong>Reason:</strong> {appointment.reason}</p>
        {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
        {appointment.consultationFee && <p><strong>Fee:</strong> ${appointment.consultationFee}</p>}
      </div>

      {appointment.videoConsultation?.videoLink && (
        <VideoPlayer videoLink={appointment.videoConsultation.videoLink} />
      )}
    </div>
  );
};

export default AppointmentDetails;
