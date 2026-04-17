import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';

const DoctorMedicalRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const doctorName = user ? `${user.firstName} ${user.lastName}` : '';

  const [form, setForm] = useState({
    patientId: '', doctorName: doctorName, chiefComplaint: '', presentIllness: '',
    visitType: 'initial', treatment: '', notes: '',
    diagnosis: [{ description: '', type: 'primary', code: '' }],
    vitalSigns: { bloodPressure: { systolic: '', diastolic: '' }, heartRate: '', temperature: '', oxygenSaturation: '' },
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await patientService.getDoctorRecords({ page, limit: 10 });
      setRecords(data.records || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await appointmentService.getDoctorAppointments({ limit: 100 });
      const appointments = data.appointments || [];
      const uniquePatients = [];
      const seen = new Set();
      appointments.forEach((apt) => {
        if (!seen.has(apt.patientId)) {
          seen.add(apt.patientId);
          uniquePatients.push({ id: apt.patientId, name: apt.patientName });
        }
      });
      setPatients(uniquePatients);
    } catch (err) {
      console.error('Failed to load patients from appointments');
    }
  };

  useEffect(() => { fetchRecords(); fetchPatients(); }, [page]);

  useEffect(() => {
    if (doctorName) setForm((prev) => ({ ...prev, doctorName }));
  }, [doctorName]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDiagnosisChange = (i, e) => {
    const updated = [...form.diagnosis];
    updated[i][e.target.name] = e.target.value;
    setForm({ ...form, diagnosis: updated });
  };

  const addDiagnosis = () => setForm({ ...form, diagnosis: [...form.diagnosis, { description: '', type: 'secondary', code: '' }] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      const vs = payload.vitalSigns;
      if (!vs.bloodPressure.systolic && !vs.bloodPressure.diastolic) delete vs.bloodPressure;
      if (!vs.heartRate) delete vs.heartRate;
      if (!vs.temperature) delete vs.temperature;
      if (!vs.oxygenSaturation) delete vs.oxygenSaturation;
      if (Object.keys(vs).length === 0) delete payload.vitalSigns;

      await patientService.createRecord(payload);
      toast.success('Medical record created');
      setShowForm(false);
      setForm({ patientId: '', doctorName, chiefComplaint: '', presentIllness: '', visitType: 'initial', treatment: '', notes: '', diagnosis: [{ description: '', type: 'primary', code: '' }], vitalSigns: { bloodPressure: { systolic: '', diastolic: '' }, heartRate: '', temperature: '', oxygenSaturation: '' } });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create record');
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Medical Records</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">{showForm ? 'Cancel' : '+ New Record'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="profile-form" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Patient *</label>
              <select name="patientId" value={form.patientId} onChange={handleChange} required>
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Doctor Name</label>
              <input name="doctorName" value={form.doctorName} readOnly style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Visit Type</label>
              <select name="visitType" value={form.visitType} onChange={handleChange}>
                <option value="initial">Initial</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="routine-checkup">Routine Checkup</option>
                <option value="specialist-referral">Specialist Referral</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Chief Complaint *</label>
            <textarea name="chiefComplaint" value={form.chiefComplaint} onChange={handleChange} required maxLength={500} />
          </div>

          <label><strong>Diagnosis *</strong></label>
          {form.diagnosis.map((d, i) => (
            <div key={i} className="form-row">
              <div className="form-group"><input name="description" placeholder="Description" value={d.description} onChange={(e) => handleDiagnosisChange(i, e)} required /></div>
              <div className="form-group">
                <select name="type" value={d.type} onChange={(e) => handleDiagnosisChange(i, e)}>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="differential">Differential</option>
                </select>
              </div>
            </div>
          ))}
          <button type="button" onClick={addDiagnosis} className="btn btn-success btn-sm">+ Add Diagnosis</button>

          <div className="form-group" style={{ marginTop: '1rem' }}><label>Treatment</label><textarea name="treatment" value={form.treatment} onChange={handleChange} /></div>

          <button type="submit" className="btn btn-primary">Create Record</button>
        </form>
      )}

      {loading ? <div className="loading">Loading...</div> : records.length === 0 ? (
        <p className="empty-state">No medical records yet.</p>
      ) : (
        <div className="records-list">
          {records.map((r) => (
            <div key={r._id} className="record-card">
              <div className="record-header">
                <h3>{r.chiefComplaint}</h3>
                <span className={`status status-${r.status}`}>{r.status}</span>
              </div>
              <p className="record-meta">Patient: {patients.find((p) => p.id === r.patientId)?.name || r.patientId} &middot; {r.visitType} &middot; {formatDate(r.createdAt)}</p>
              {r.diagnosis?.length > 0 && <p className="record-diagnosis">{r.diagnosis.map((d) => d.description).join(', ')}</p>}
            </div>
          ))}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary">Previous</button>
              <span>Page {page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn btn-secondary">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorMedicalRecords;
