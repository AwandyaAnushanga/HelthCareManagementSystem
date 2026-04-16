import React, { useState, useEffect } from 'react';
import doctorService from '../../services/doctorService';

const SlotPicker = ({ doctorId, onSlotSelect, selectedSlot }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!date || !doctorId) return;

    const fetchSlots = async () => {
      setLoading(true);
      setMessage('');
      try {
        const { data } = await doctorService.getSlots(doctorId, date);
        setSlots(data.slots || []);
        if (data.slots?.length === 0) {
          setMessage(data.message || 'No slots available for this date');
        }
      } catch (err) {
        setMessage('Failed to load available slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [date, doctorId]);

  // Minimum date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="slot-picker">
      <div className="form-group">
        <label>Select Date</label>
        <input
          type="date"
          value={date}
          min={minDateStr}
          onChange={(e) => {
            setDate(e.target.value);
            onSlotSelect(e.target.value, '');
          }}
          required
        />
      </div>

      {loading && <p className="loading">Loading available slots...</p>}
      {message && <p className="slot-message">{message}</p>}

      {slots.length > 0 && (
        <div className="slots-grid">
          {slots.map((slot) => {
            const timeSlot = `${slot.start}-${slot.end}`;
            const isSelected = selectedSlot === timeSlot;
            return (
              <button
                key={timeSlot}
                type="button"
                className={`slot-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => onSlotSelect(date, timeSlot)}
              >
                {slot.start} - {slot.end}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
