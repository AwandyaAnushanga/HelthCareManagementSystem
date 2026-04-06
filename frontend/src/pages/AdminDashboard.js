import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, doctorsRes] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getDoctors(),
        ]);
        setAnalytics(analyticsRes.data);
        setDoctors(doctorsRes.data.doctors || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerify = async (doctorId) => {
    try {
      await adminService.verifyDoctor(doctorId);
      setDoctors((prev) =>
        prev.map((d) => (d._id === doctorId ? { ...d, isVerified: true } : d))
      );
      toast.success('Doctor verified');
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>

      {analytics && (
        <div className="analytics-section">
          <h2>System Analytics</h2>
          <p>Total events logged: {analytics.totalEvents}</p>
          <div className="event-breakdown">
            {analytics.eventBreakdown?.map((e) => (
              <span key={e._id} className="event-badge">{e._id}: {e.count}</span>
            ))}
          </div>
        </div>
      )}

      <h2>Doctors</h2>
      <div className="doctor-list">
        {doctors.map((doc) => (
          <div key={doc._id} className="doctor-card">
            <h3>Dr. {doc.firstName} {doc.lastName}</h3>
            <p>{doc.specialization} | Fee: ${doc.consultationFee}</p>
            <span className={doc.isVerified ? 'verified' : 'unverified'}>
              {doc.isVerified ? 'Verified' : 'Unverified'}
            </span>
            {!doc.isVerified && (
              <button onClick={() => handleVerify(doc._id)} className="btn btn-success">Verify</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
