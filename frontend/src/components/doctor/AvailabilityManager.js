import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import doctorService from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityManager = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
  });
  const [overrideForm, setOverrideForm] = useState({
    date: '',
    isAvailable: false,
    reason: '',
  });
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const fetchAvailability = async () => {
    try {
      const { data } = await doctorService.getAvailability(user._id || user.id);
      setSlots(data);
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []); // eslint-disable-line

  const handleSetAvailability = async (e) => {
    e.preventDefault();
    try {
      await doctorService.setAvailability(form);
      toast.success(`Availability set for ${DAYS[form.dayOfWeek]}`);
      fetchAvailability();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set availability');
    }
  };

  const handleDelete = async (dayOfWeek) => {
    try {
      await doctorService.deleteAvailability(dayOfWeek);
      toast.success(`Availability removed for ${DAYS[dayOfWeek]}`);
      fetchAvailability();
    } catch (err) {
      toast.error('Failed to remove availability');
    }
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    try {
      await doctorService.addOverride(overrideForm);
      toast.success('Date override added');
      setShowOverrideForm(false);
      setOverrideForm({ date: '', isAvailable: false, reason: '' });
      fetchAvailability();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add override');
    }
  };

  return (
    <div className="availability-section">
      <h2>Availability Management</h2>

      {/* Set weekly schedule */}
      <div className="availability-form-container">
        <h3>Set Weekly Schedule</h3>
        <form onSubmit={handleSetAvailability} className="availability-form">
          <div className="form-row">
            <div className="form-group">
              <label>Day</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}>
                {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Slot Duration (min)</label>
              <select value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: parseInt(e.target.value) })}>
                {[15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Save Schedule</button>
        </form>
      </div>

      {/* Current schedule */}
      <div className="current-schedule">
        <h3>Current Schedule</h3>
        {loading ? (
          <p>Loading...</p>
        ) : slots.length === 0 ? (
          <p className="empty-state">No availability set. Add your weekly schedule above.</p>
        ) : (
          <div className="schedule-grid">
            {slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((slot) => (
              <div key={slot._id} className="schedule-card">
                <div className="schedule-header">
                  <h4>{DAYS[slot.dayOfWeek]}</h4>
                  <button onClick={() => handleDelete(slot.dayOfWeek)} className="btn btn-danger btn-sm">Remove</button>
                </div>
                <p>{slot.startTime} - {slot.endTime}</p>
                <p className="schedule-meta">{slot.slotDuration} min slots &middot; {slot.maxPatientsPerSlot} patient{slot.maxPatientsPerSlot > 1 ? 's' : ''}/slot</p>
                {slot.overrides?.length > 0 && (
                  <div className="overrides">
                    <strong>Overrides:</strong>
                    {slot.overrides.map((o) => (
                      <span key={o._id} className={`override-tag ${o.isAvailable ? 'available' : 'unavailable'}`}>
                        {new Date(o.date).toLocaleDateString()} — {o.isAvailable ? 'Available' : 'Unavailable'} {o.reason && `(${o.reason})`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date overrides */}
      <div className="override-section">
        <button onClick={() => setShowOverrideForm(!showOverrideForm)} className="btn btn-secondary">
          {showOverrideForm ? 'Cancel' : 'Add Date Override'}
        </button>

        {showOverrideForm && (
          <form onSubmit={handleAddOverride} className="override-form">
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={overrideForm.date} onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Available?</label>
                <select
                  value={overrideForm.isAvailable.toString()}
                  onChange={(e) => setOverrideForm({ ...overrideForm, isAvailable: e.target.value === 'true' })}
                >
                  <option value="false">Not Available (Day Off)</option>
                  <option value="true">Available (Override Hours)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  placeholder="e.g., Conference, Holiday"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Override</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManager;
