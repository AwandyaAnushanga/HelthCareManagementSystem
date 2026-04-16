import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../../services/patientService';
import { formatDate } from '../../utils/formatDate';

const DoctorMedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [form, setForm] = useState({
    patientId: '', doctorName: '', chiefComplaint: '', presentIllness: '',
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

  useEffect(() => { fetchRecords(); }, [page]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDiagnosisChange = (i, e) => {
    const updated = [...form.diagnosis];
    updated[i][e.target.name] = e.target.value;
    setForm({ ...form, diagnosis: updated });
  };

  const addDiagnosis = () => setForm({ ...form, diagnosis: [...form.diagnosis, { description: '', type: 'secondary', code: '' }] });

  const handleVitalChange = (field, value) => {
    if (field === 'systolic' || field === 'diastolic') {
      setForm({ ...form, vitalSigns: { ...form.vitalSigns, bloodPressure: { ...form.vitalSigns.bloodPressure, [field]: value } } });
    } else {
      setForm({ ...form, vitalSigns: { ...form.vitalSigns, [field]: value } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      // Clean empty vitals
      const vs = payload.vitalSigns;
      if (!vs.bloodPressure.systolic && !vs.bloodPressure.diastolic) delete vs.bloodPressure;
      if (!vs.heartRate) delete vs.heartRate;
      if (!vs.temperature) delete vs.temperature;
      if (!vs.oxygenSaturation) delete vs.oxygenSaturation;
      if (Object.keys(vs).length === 0) delete payload.vitalSigns;

      await patientService.createRecord(payload);
      toast.success('Medical record created');
      setShowForm(false);
      setForm({ patientId: '', doctorName: '', chiefComplaint: '', presentIllness: '', visitType: 'initial', treatment: '', notes: '', diagnosis: [{ description: '', type: 'primary', code: '' }], vitalSigns: { bloodPressure: { systolic: '', diastolic: '' }, heartRate: '', temperature: '', oxygenSaturation: '' } });
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
              <label>Patient ID *</label>
              <input name="patientId" value={form.patientId} onChange={handleChange} required placeholder="MongoDB ObjectId of the patient" />
            </div>
            <div className="form-group">
              <label>Doctor Name *</label>
              <input name="doctorName" value={form.doctorName} onChange={handleChange} required />
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
          <div className="form-group">
            <label>Present Illness</label>
            <textarea name="presentIllness" value={form.presentIllness} onChange={handleChange} />
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
              <div className="form-group"><input name="code" placeholder="ICD Code (optional)" value={d.code} onChange={(e) => handleDiagnosisChange(i, e)} /></div>
            </div>
          ))}
          <button type="button" onClick={addDiagnosis} className="btn btn-success btn-sm">+ Add Diagnosis</button>

          <label style={{ marginTop: '1rem' }}><strong>Vital Signs (optional)</strong></label>
          <div className="form-row">
            <div className="form-group"><label>Systolic BP</label><input type="number" value={form.vitalSigns.bloodPressure.systolic} onChange={(e) => handleVitalChange('systolic', e.target.value)} min="50" max="300" /></div>
            <div className="form-group"><label>Diastolic BP</label><input type="number" value={form.vitalSigns.bloodPressure.diastolic} onChange={(e) => handleVitalChange('diastolic', e.target.value)} min="30" max="200" /></div>
            <div className="form-group"><label>Heart Rate</label><input type="number" value={form.vitalSigns.heartRate} onChange={(e) => handleVitalChange('heartRate', e.target.value)} min="20" max="250" /></div>
            <div className="form-group"><label>Temperature (°C)</label><input type="number" step="0.1" value={form.vitalSigns.temperature} onChange={(e) => handleVitalChange('temperature', e.target.value)} min="30" max="45" /></div>
          </div>

          <div className="form-group"><label>Treatment</label><textarea name="treatment" value={form.treatment} onChange={handleChange} /></div>
          <div className="form-group"><label>Notes</label><textarea name="notes" value={form.notes} onChange={handleChange} /></div>

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
              <p className="record-meta">Patient: {r.patientId} &middot; {r.visitType} &middot; {formatDate(r.createdAt)}</p>
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
