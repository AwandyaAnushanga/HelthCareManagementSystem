import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../../services/patientService';
import { formatDate } from '../../utils/formatDate';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const { data } = await patientService.getMyRecords({ page, limit: 10 });
        setRecords(data.records);
        setPagination(data.pagination);
      } catch (err) {
        toast.error('Failed to load medical records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [page]);

  const viewRecord = async (id) => {
    try {
      const { data } = await patientService.getRecordById(id);
      setSelectedRecord(data);
    } catch (err) {
      toast.error('Failed to load record details');
    }
  };

  if (selectedRecord) {
    return (
      <div className="record-detail">
        <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary">Back to Records</button>
        <h2>Medical Record — {formatDate(selectedRecord.createdAt)}</h2>
        <div className="detail-card">
          <div className="detail-grid">
            <p><strong>Doctor:</strong> {selectedRecord.doctorName}</p>
            <p><strong>Visit Type:</strong> {selectedRecord.visitType}</p>
            <p><strong>Status:</strong> <span className={`status status-${selectedRecord.status}`}>{selectedRecord.status}</span></p>
          </div>

          <h3>Chief Complaint</h3>
          <p>{selectedRecord.chiefComplaint}</p>

          {selectedRecord.presentIllness && (
            <>
              <h3>Present Illness</h3>
              <p>{selectedRecord.presentIllness}</p>
            </>
          )}

          {selectedRecord.diagnosis?.length > 0 && (
            <>
              <h3>Diagnosis</h3>
              <ul className="diagnosis-list">
                {selectedRecord.diagnosis.map((d, i) => (
                  <li key={i}>
                    <span className={`diagnosis-type type-${d.type}`}>{d.type}</span>
                    {d.description} {d.code && <code>({d.code})</code>}
                  </li>
                ))}
              </ul>
            </>
          )}

          {selectedRecord.vitalSigns && (
            <>
              <h3>Vital Signs</h3>
              <div className="vitals-grid">
                {selectedRecord.vitalSigns.bloodPressure && (
                  <div className="vital-item">
                    <span className="vital-label">Blood Pressure</span>
                    <span className="vital-value">{selectedRecord.vitalSigns.bloodPressure.systolic}/{selectedRecord.vitalSigns.bloodPressure.diastolic} mmHg</span>
                  </div>
                )}
                {selectedRecord.vitalSigns.heartRate && (
                  <div className="vital-item">
                    <span className="vital-label">Heart Rate</span>
                    <span className="vital-value">{selectedRecord.vitalSigns.heartRate} bpm</span>
                  </div>
                )}
                {selectedRecord.vitalSigns.temperature && (
                  <div className="vital-item">
                    <span className="vital-label">Temperature</span>
                    <span className="vital-value">{selectedRecord.vitalSigns.temperature}°C</span>
                  </div>
                )}
                {selectedRecord.vitalSigns.oxygenSaturation && (
                  <div className="vital-item">
                    <span className="vital-label">SpO2</span>
                    <span className="vital-value">{selectedRecord.vitalSigns.oxygenSaturation}%</span>
                  </div>
                )}
              </div>
            </>
          )}

          {selectedRecord.treatment && (
            <>
              <h3>Treatment</h3>
              <p>{selectedRecord.treatment}</p>
            </>
          )}

          {selectedRecord.notes && (
            <>
              <h3>Notes</h3>
              <p>{selectedRecord.notes}</p>
            </>
          )}

          {selectedRecord.followUpDate && (
            <p className="follow-up"><strong>Follow-up:</strong> {formatDate(selectedRecord.followUpDate)}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="records-section">
      <h2>Medical Records</h2>

      {loading ? (
        <div className="loading">Loading records...</div>
      ) : records.length === 0 ? (
        <p className="empty-state">No medical records found.</p>
      ) : (
        <>
          <div className="records-list">
            {records.map((record) => (
              <div key={record._id} className="record-card" onClick={() => viewRecord(record._id)}>
                <div className="record-header">
                  <h3>{record.chiefComplaint}</h3>
                  <span className={`status status-${record.status}`}>{record.status}</span>
                </div>
                <p className="record-meta">
                  Dr. {record.doctorName} &middot; {record.visitType} &middot; {formatDate(record.createdAt)}
                </p>
                {record.diagnosis?.length > 0 && (
                  <p className="record-diagnosis">{record.diagnosis.map((d) => d.description).join(', ')}</p>
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

export default MedicalRecords;
