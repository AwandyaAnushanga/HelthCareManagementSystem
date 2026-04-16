import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import appointmentService from '../services/appointmentService';
import NotificationBell from '../components/notifications/NotificationBell';
import PatientProfile from '../components/patient/PatientProfile';
import MedicalRecords from '../components/patient/MedicalRecords';
import Prescriptions from '../components/patient/Prescriptions';
import AppointmentCard from '../components/appointments/AppointmentCard';

const TABS = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'records', label: 'Medical Records' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'profile', label: 'Profile' },
];

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentService.getPatientAppointments({ page, limit: 10 });
      setAppointments(data.appointments);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (activeTab === 'appointments') fetchAppointments();
  }, [activeTab, fetchAppointments]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <div className="header-actions">
          <NotificationBell />
          <Link to="/book-appointment" className="btn btn-primary">Book Appointment</Link>
        </div>
      </div>

      <div className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'appointments' && (
          <div>
            {loading ? (
              <div className="loading">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="empty-state">
                <p>No appointments yet.</p>
                <Link to="/book-appointment" className="btn btn-primary">Book Your First Appointment</Link>
              </div>
            ) : (
              <>
                <div className="appointment-list">
                  {appointments.map((apt) => (
                    <AppointmentCard key={apt._id} appointment={apt} onUpdate={fetchAppointments} />
                  ))}
                </div>
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary">Previous</button>
                    <span>Page {page} of {pagination.pages}</span>
                    <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn btn-secondary">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'records' && <MedicalRecords />}
        {activeTab === 'prescriptions' && <Prescriptions />}
        {activeTab === 'profile' && <PatientProfile />}
      </div>
    </div>
  );
};

export default PatientDashboard;
