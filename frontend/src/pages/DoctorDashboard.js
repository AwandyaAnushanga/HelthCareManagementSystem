import React, { useState } from 'react';
import NotificationBell from '../components/notifications/NotificationBell';
import DoctorAppointments from '../components/doctor/DoctorAppointments';
import AvailabilityManager from '../components/doctor/AvailabilityManager';
import DoctorProfile from '../components/doctor/DoctorProfile';
import DoctorMedicalRecords from '../components/doctor/DoctorMedicalRecords';
import DoctorPrescriptions from '../components/doctor/DoctorPrescriptions';

const TABS = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'records', label: 'Medical Records' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'availability', label: 'Availability' },
  { key: 'profile', label: 'Profile' },
];

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <NotificationBell />
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
        {activeTab === 'appointments' && <DoctorAppointments />}
        {activeTab === 'records' && <DoctorMedicalRecords />}
        {activeTab === 'prescriptions' && <DoctorPrescriptions />}
        {activeTab === 'availability' && <AvailabilityManager />}
        {activeTab === 'profile' && <DoctorProfile />}
      </div>
    </div>
  );
};

export default DoctorDashboard;
