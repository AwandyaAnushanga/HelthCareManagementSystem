import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../../services/patientService';

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await patientService.getProfile();
        setProfile(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          bloodGroup: data.bloodGroup || '',
          'address.street': data.address?.street || '',
          'address.city': data.address?.city || '',
          'address.state': data.address?.state || '',
          'address.zipCode': data.address?.zipCode || '',
          'emergencyContact.name': data.emergencyContact?.name || '',
          'emergencyContact.phone': data.emergencyContact?.phone || '',
          'emergencyContact.relationship': data.emergencyContact?.relationship || '',
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Unflatten nested fields
      const updateData = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bloodGroup: form.bloodGroup || undefined,
        address: {
          street: form['address.street'],
          city: form['address.city'],
          state: form['address.state'],
          zipCode: form['address.zipCode'],
        },
        emergencyContact: {
          name: form['emergencyContact.name'],
          phone: form['emergencyContact.phone'],
          relationship: form['emergencyContact.relationship'],
        },
      };

      const { data } = await patientService.updateProfile(updateData);
      setProfile(data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return null;

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>My Profile</h2>
        <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Blood Group</label>
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <h3>Address</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Street</label>
              <input name="address.street" value={form['address.street']} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="address.city" value={form['address.city']} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>State</label>
              <input name="address.state" value={form['address.state']} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Zip Code</label>
              <input name="address.zipCode" value={form['address.zipCode']} onChange={handleChange} />
            </div>
          </div>

          <h3>Emergency Contact</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input name="emergencyContact.name" value={form['emergencyContact.name']} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="emergencyContact.phone" value={form['emergencyContact.phone']} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Relationship</label>
            <input name="emergencyContact.relationship" value={form['emergencyContact.relationship']} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      ) : (
        <div className="profile-display">
          <div className="profile-grid">
            <div><strong>Name:</strong> {profile.firstName} {profile.lastName}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Phone:</strong> {profile.phone}</div>
            <div><strong>Gender:</strong> {profile.gender}</div>
            <div><strong>Date of Birth:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</div>
            <div><strong>Blood Group:</strong> {profile.bloodGroup || 'Not set'}</div>
            {profile.address?.city && (
              <div><strong>Address:</strong> {[profile.address.street, profile.address.city, profile.address.state].filter(Boolean).join(', ')}</div>
            )}
            {profile.emergencyContact?.name && (
              <div><strong>Emergency Contact:</strong> {profile.emergencyContact.name} ({profile.emergencyContact.relationship}) - {profile.emergencyContact.phone}</div>
            )}
          </div>
          {profile.allergies?.length > 0 && (
            <div className="tag-list">
              <strong>Allergies:</strong> {profile.allergies.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
            </div>
          )}
          {profile.chronicConditions?.length > 0 && (
            <div className="tag-list">
              <strong>Conditions:</strong> {profile.chronicConditions.map((c, i) => <span key={i} className="tag">{c}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
