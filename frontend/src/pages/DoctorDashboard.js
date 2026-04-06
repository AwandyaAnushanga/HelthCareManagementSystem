import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService from '../services/appointmentService';
import NotificationBell from '../components/notifications/NotificationBell';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await appointmentService.getDoctorAppointments({ limit: 10 });
        setAppointments(data.appointments);
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, { status });
      setAppointments((prev) =>
        prev.map((apt) => (apt._id === id ? { ...apt, status } : apt))
      );
      toast.success(`Appointment ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleVideoLink = async (id) => {
    const videoLink = prompt('Enter the video consultation link (Google Drive URL):');
    if (!videoLink) return;
    try {
      await appointmentService.addVideoLink(id, { videoLink });
      toast.success('Video link added');
    } catch (err) {
      toast.error('Failed to add video link');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <NotificationBell />
      </div>

      <h2>Appointments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments.</p>
      ) : (
        <div className="appointment-list">
          {appointments.map((apt) => (
            <div key={apt._id} className="appointment-card">
              <h3>{apt.patientName}</h3>
              <p>{new Date(apt.appointmentDate).toLocaleDateString()} - {apt.timeSlot}</p>
              <p>Type: {apt.type} | Reason: {apt.reason}</p>
              <span className={`status status-${apt.status}`}>{apt.status}</span>

              {apt.status === 'pending' && (
                <div className="action-buttons">
                  <button onClick={() => handleStatusUpdate(apt._id, 'confirmed')} className="btn btn-success">Confirm</button>
                  <button onClick={() => handleStatusUpdate(apt._id, 'cancelled')} className="btn btn-danger">Cancel</button>
                </div>
              )}
              {apt.type === 'video' && apt.status === 'confirmed' && (
                <button onClick={() => handleVideoLink(apt._id)} className="btn btn-info">Add Video Link</button>
              )}
              <Link to={`/appointments/${apt._id}`}>View Details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
