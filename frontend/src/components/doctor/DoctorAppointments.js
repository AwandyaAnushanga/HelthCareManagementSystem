import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import appointmentService from '../../services/appointmentService';
import { formatDate } from '../../utils/formatDate';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const { data } = await appointmentService.getDoctorAppointments(params);
      setAppointments(data.appointments);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleVideoLink = async (id) => {
    const videoLink = prompt('Enter the video consultation link:');
    if (!videoLink) return;
    try {
      await appointmentService.addVideoLink(id, { videoLink });
      toast.success('Video link added');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to add video link');
    }
  };

  const handleAddNotes = async (id) => {
    const doctorNotes = prompt('Enter doctor notes for this appointment:');
    if (!doctorNotes) return;
    try {
      await appointmentService.addDoctorNotes(id, { doctorNotes });
      toast.success('Notes added');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to add notes');
    }
  };

  return (
    <div className="doctor-appointments">
      <div className="section-header">
        <h2>My Appointments</h2>
        <div className="filters">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="filter-date"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="btn btn-secondary btn-sm">Clear Date</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <p className="empty-state">No appointments found.</p>
      ) : (
        <>
          <div className="appointment-list">
            {appointments.map((apt) => (
              <div key={apt._id} className="appointment-card">
                <div className="apt-header">
                  <h3>{apt.patientName}</h3>
                  <span className={`status status-${apt.status}`}>{apt.status}</span>
                </div>
                <p>{formatDate(apt.appointmentDate)} &middot; {apt.timeSlot} &middot; {apt.type}</p>
                <p><strong>Reason:</strong> {apt.reason}</p>
                {apt.priority !== 'normal' && (
                  <span className={`tag tag-${apt.priority === 'emergency' ? 'danger' : 'warning'}`}>{apt.priority}</span>
                )}

                <div className="action-buttons">
                  {apt.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatusUpdate(apt._id, 'confirmed')} className="btn btn-success btn-sm">Confirm</button>
                      <button onClick={() => handleStatusUpdate(apt._id, 'cancelled')} className="btn btn-danger btn-sm">Cancel</button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <>
                      <button onClick={() => handleStatusUpdate(apt._id, 'in-progress')} className="btn btn-info btn-sm">Start Visit</button>
                      {apt.type === 'video' && (
                        <button onClick={() => handleVideoLink(apt._id)} className="btn btn-secondary btn-sm">Add Video Link</button>
                      )}
                    </>
                  )}
                  {apt.status === 'in-progress' && (
                    <button onClick={() => handleStatusUpdate(apt._id, 'completed')} className="btn btn-success btn-sm">Complete</button>
                  )}
                  {['confirmed', 'in-progress', 'completed'].includes(apt.status) && (
                    <button onClick={() => handleAddNotes(apt._id)} className="btn btn-secondary btn-sm">Add Notes</button>
                  )}
                  <Link to={`/appointments/${apt._id}`} className="btn btn-secondary btn-sm">Details</Link>
                </div>
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

export default DoctorAppointments;
