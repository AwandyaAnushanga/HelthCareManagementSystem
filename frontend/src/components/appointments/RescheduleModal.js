import React, { useState } from 'react';
import { toast } from 'react-toastify';
import appointmentService from '../../services/appointmentService';
import SlotPicker from './SlotPicker';

const RescheduleModal = ({ appointment, onClose, onRescheduled }) => {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSlotSelect = (selectedDate, selectedSlot) => {
    setDate(selectedDate);
    setTimeSlot(selectedSlot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !timeSlot) {
      return toast.error('Please select a date and time slot');
    }

    setLoading(true);
    try {
      const { data } = await appointmentService.reschedule(appointment._id, {
        appointmentDate: date,
        timeSlot,
        reason,
      });
      toast.success('Appointment rescheduled');
      onRescheduled(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reschedule failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reschedule Appointment</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        <div className="modal-body">
          <p className="reschedule-info">
            Current: {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
          </p>

          <form onSubmit={handleSubmit}>
            <SlotPicker
              doctorId={appointment.doctorId}
              onSlotSelect={handleSlotSelect}
              selectedSlot={timeSlot}
            />

            <div className="form-group">
              <label>Reason for Rescheduling</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={loading || !timeSlot} className="btn btn-primary">
                {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
