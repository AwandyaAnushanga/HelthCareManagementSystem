import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getDoctors({ page, limit: 20 });
      setDoctors(data.doctors || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page]); // eslint-disable-line

  const handleVerify = async (doctorId) => {
    try {
      await adminService.verifyDoctor(doctorId);
      toast.success('Doctor verified');
      fetchDoctors();
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  const handleReject = async (doctorId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await adminService.rejectDoctor(doctorId, { reason });
      toast.success('Doctor rejected');
      fetchDoctors();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  return (
    <div className="doctor-management">
      <h2>Doctor Management</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="doctor-list">
            {doctors.map((doc) => (
              <div key={doc._id} className="doctor-card">
                <div className="doc-info">
                  <h3>Dr. {doc.firstName} {doc.lastName}</h3>
                  <p>{doc.specialization} &middot; Fee: ${doc.consultationFee}</p>
                  <p>{doc.email} &middot; {doc.phone}</p>
                  <span className={doc.isVerified ? 'verified' : 'unverified'}>
                    {doc.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {!doc.isVerified && (
                  <div className="action-buttons">
                    <button onClick={() => handleVerify(doc._id)} className="btn btn-success btn-sm">Verify</button>
                    <button onClick={() => handleReject(doc._id)} className="btn btn-danger btn-sm">Reject</button>
                  </div>
                )}
              </div>
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
  );
};

export default DoctorManagement;
