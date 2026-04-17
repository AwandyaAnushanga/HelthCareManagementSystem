import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';

const FREQUENCIES = [
  { value: 'once_daily', label: 'Once Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: '3x Daily' },
  { value: 'four_times_daily', label: '4x Daily' },
  { value: 'every_6_hours', label: 'Every 6 Hours' },
  { value: 'every_8_hours', label: 'Every 8 Hours' },
  { value: 'every_12_hours', label: 'Every 12 Hours' },
  { value: 'once_weekly', label: 'Once Weekly' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'before_meals', label: 'Before Meals' },
  { value: 'after_meals', label: 'After Meals' },
  { value: 'at_bedtime', label: 'At Bedtime' },
];

const emptyMedication = { name: '', dosage: '', frequency: 'once_daily', duration: { value: 7, unit: 'days' }, instructions: '' };

const DoctorPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const doctorName = user ? `${user.firstName} ${user.lastName}` : '';

  const [form, setForm] = useState({
    patientId: '', patientName: '', doctorName: doctorName, diagnosis: '', validUntil: '',
    medications: [{ ...emptyMedication }],
    notes: '',
  });

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data } = await patientService.getDoctorPrescriptions({ page, limit: 10 });
      setPrescriptions(data.prescriptions || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error('Failed to load prescriptions');
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

  useEffect(() => { fetchPrescriptions(); fetchPatients(); }, [page]);

  useEffect(() => {
    if (doctorName) setForm((prev) => ({ ...prev, doctorName }));
  }, [doctorName]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMedChange = (i, e) => {
    const updated = [...form.medications];
    if (e.target.name === 'durationValue') {
      updated[i].duration.value = e.target.value;
    } else if (e.target.name === 'durationUnit') {
      updated[i].duration.unit = e.target.value;
    } else {
      updated[i][e.target.name] = e.target.value;
    }
    setForm({ ...form, medications: updated });
  };

  const addMedication = () => setForm({ ...form, medications: [...form.medications, { ...emptyMedication }] });

  const removeMedication = (i) => {
    if (form.medications.length > 1) setForm({ ...form, medications: form.medications.filter((_, idx) => idx !== i) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientService.createPrescription(form);
      toast.success('Prescription created');
      setShowForm(false);
      setForm({ patientId: '', patientName: '', doctorName: '', diagnosis: '', validUntil: '', medications: [{ ...emptyMedication }], notes: '' });
      fetchPrescriptions();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create prescription');
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Prescriptions</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">{showForm ? 'Cancel' : '+ New Prescription'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="profile-form" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Patient *</label>
              <select name="patientId" value={form.patientId} onChange={(e) => {
                const selected = patients.find((p) => p.id === e.target.value);
                setForm({ ...form, patientId: e.target.value, patientName: selected ? selected.name : '' });
              }} required>
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Patient Name</label><input name="patientName" value={form.patientName} readOnly style={{ background: '#f1f5f9', cursor: 'not-allowed' }} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Doctor Name</label><input name="doctorName" value={form.doctorName} readOnly style={{ background: '#f1f5f9', cursor: 'not-allowed' }} /></div>
            <div className="form-group"><label>Valid Until *</label><input type="date" name="validUntil" value={form.validUntil} onChange={handleChange} required /></div>
          </div>
          <div className="form-group"><label>Diagnosis *</label><input name="diagnosis" value={form.diagnosis} onChange={handleChange} required maxLength={500} /></div>

          <label><strong>Medications *</strong></label>
          {form.medications.map((med, i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', borderLeft: '3px solid #2563eb' }}>
              <div className="form-row">
                <div className="form-group"><label>Name *</label><input name="name" value={med.name} onChange={(e) => handleMedChange(i, e)} required /></div>
                <div className="form-group"><label>Dosage *</label><input name="dosage" value={med.dosage} onChange={(e) => handleMedChange(i, e)} required placeholder="e.g. 500mg" /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Frequency *</label>
                  <select name="frequency" value={med.frequency} onChange={(e) => handleMedChange(i, e)}>
                    {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Duration *</label><input type="number" name="durationValue" value={med.duration.value} onChange={(e) => handleMedChange(i, e)} required min="1" /></div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="durationUnit" value={med.duration.unit} onChange={(e) => handleMedChange(i, e)}>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Instructions</label><input name="instructions" value={med.instructions} onChange={(e) => handleMedChange(i, e)} placeholder="e.g. Take with food" /></div>
              {form.medications.length > 1 && <button type="button" onClick={() => removeMedication(i)} className="btn btn-danger btn-sm">Remove</button>}
            </div>
          ))}
          <button type="button" onClick={addMedication} className="btn btn-success btn-sm">+ Add Medication</button>

          <div className="form-group" style={{ marginTop: '1rem' }}><label>Notes</label><textarea name="notes" value={form.notes} onChange={handleChange} /></div>
          <button type="submit" className="btn btn-primary">Create Prescription</button>
        </form>
      )}

      {loading ? <div className="loading">Loading...</div> : prescriptions.length === 0 ? (
        <p className="empty-state">No prescriptions yet.</p>
      ) : (
        <div className="prescriptions-list">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="prescription-card">
              <div className="rx-header">
                <h3>Rx #{rx.prescriptionNumber || rx._id.slice(-6)}</h3>
                <span className={`status status-${rx.status}`}>{rx.status}</span>
              </div>
              <p className="rx-meta">Patient: {rx.patientName} &middot; {formatDate(rx.createdAt)}</p>
              <p><strong>Diagnosis:</strong> {rx.diagnosis}</p>
              <p><strong>Medications:</strong> {rx.medications?.map((m) => m.name).join(', ')}</p>
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

export default DoctorPrescriptions;
