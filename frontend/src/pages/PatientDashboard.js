import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import appointmentService from '../services/appointmentService';
import NotificationBell from '../components/notifications/NotificationBell';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentService.getPatientAppointments({ limit: 5 });
        setAppointments(data.appointments);
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <NotificationBell />
      </div>
      <Link to="/book-appointment" className="btn btn-primary">Book New Appointment</Link>

      <h2>Recent Appointments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments yet.</p>
      ) : (
        <div className="appointment-list">
          {appointments.map((apt) => (
            <div key={apt._id} className="appointment-card">
              <h3>Dr. {apt.doctorName}</h3>
              <p>{new Date(apt.appointmentDate).toLocaleDateString()} - {apt.timeSlot}</p>
              <span className={`status status-${apt.status}`}>{apt.status}</span>
              {apt.videoConsultation?.videoLink && (
                <a href={apt.videoConsultation.videoLink} target="_blank" rel="noopener noreferrer" className="btn-video">
                  View Video Consultation
                </a>
              )}
              <Link to={`/appointments/${apt._id}`}>View Details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
