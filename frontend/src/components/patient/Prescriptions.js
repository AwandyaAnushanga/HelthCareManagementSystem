import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../../services/patientService';
import { formatDate } from '../../utils/formatDate';

const FREQUENCY_LABELS = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: 'Three times daily',
  four_times_daily: 'Four times daily',
  every_6_hours: 'Every 6 hours',
  every_8_hours: 'Every 8 hours',
  every_12_hours: 'Every 12 hours',
  once_weekly: 'Once weekly',
  as_needed: 'As needed',
  before_meals: 'Before meals',
  after_meals: 'After meals',
  at_bedtime: 'At bedtime',
  custom: 'Custom',
};

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (filter) params.status = filter;
        const { data } = await patientService.getMyPrescriptions(params);
        setPrescriptions(data.prescriptions);
        setPagination(data.pagination);
      } catch (err) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [page, filter]);

  const viewPrescription = async (id) => {
    try {
      const { data } = await patientService.getPrescriptionById(id);
      setSelectedRx(data);
    } catch (err) {
      toast.error('Failed to load prescription');
    }
  };

  if (selectedRx) {
    return (
      <div className="prescription-detail">
        <button onClick={() => setSelectedRx(null)} className="btn btn-secondary">Back to Prescriptions</button>
        <h2>Prescription #{selectedRx.prescriptionNumber}</h2>
        <div className="detail-card">
          <div className="detail-grid">
            <p><strong>Doctor:</strong> {selectedRx.doctorName}</p>
            <p><strong>Prescribed:</strong> {formatDate(selectedRx.prescribedDate)}</p>
            <p><strong>Valid Until:</strong> {formatDate(selectedRx.validUntil)}</p>
            <p><strong>Status:</strong> <span className={`status status-${selectedRx.status}`}>{selectedRx.status}</span></p>
          </div>

          <h3>Diagnosis</h3>
          <p>{selectedRx.diagnosis}</p>

          <h3>Medications</h3>
          <div className="medications-list">
            {selectedRx.medications.map((med, i) => (
              <div key={med._id || i} className="medication-card">
                <div className="med-header">
                  <h4>{med.name} {med.isCritical && <span className="tag tag-danger">Critical</span>}</h4>
                  <span className="med-dosage">{med.dosage}</span>
                </div>
                {med.genericName && <p className="med-generic">Generic: {med.genericName}</p>}
                <div className="med-details">
                  <span>Frequency: {FREQUENCY_LABELS[med.frequency] || med.frequency}</span>
                  <span>Route: {med.route}</span>
                  <span>Duration: {med.duration.value} {med.duration.unit}</span>
                  {med.quantity && <span>Qty: {med.quantity}</span>}
                  {med.refills > 0 && <span>Refills: {med.refills}</span>}
                </div>
                {med.instructions && <p className="med-instructions">{med.instructions}</p>}
                {med.sideEffects?.length > 0 && (
                  <p className="med-side-effects">
                    <strong>Side effects:</strong> {med.sideEffects.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {selectedRx.generalInstructions && (
            <>
              <h3>General Instructions</h3>
              <p>{selectedRx.generalInstructions}</p>
            </>
          )}
          {selectedRx.dietaryAdvice && (
            <>
              <h3>Dietary Advice</h3>
              <p>{selectedRx.dietaryAdvice}</p>
            </>
          )}
          {selectedRx.warningsAndPrecautions && (
            <div className="warning-box">
              <strong>Warnings:</strong> {selectedRx.warningsAndPrecautions}
            </div>
          )}

          {selectedRx.followUpRequired && selectedRx.followUpDate && (
            <p className="follow-up"><strong>Follow-up:</strong> {formatDate(selectedRx.followUpDate)}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="prescriptions-section">
      <div className="section-header">
        <h2>Prescriptions</h2>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <p className="empty-state">No prescriptions found.</p>
      ) : (
        <>
          <div className="prescriptions-list">
            {prescriptions.map((rx) => (
              <div key={rx._id} className="prescription-card" onClick={() => viewPrescription(rx._id)}>
                <div className="rx-header">
                  <h3>#{rx.prescriptionNumber}</h3>
                  <span className={`status status-${rx.status}`}>{rx.status}</span>
                </div>
                <p className="rx-meta">Dr. {rx.doctorName} &middot; {formatDate(rx.prescribedDate)}</p>
                <p>{rx.diagnosis}</p>
                <p className="rx-meds">{rx.medications.length} medication{rx.medications.length !== 1 ? 's' : ''}</p>
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

export default Prescriptions;
