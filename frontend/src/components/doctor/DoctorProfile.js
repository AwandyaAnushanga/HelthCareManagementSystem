import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import doctorService from '../../services/doctorService';

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await doctorService.getProfile();
        setProfile(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          bio: data.bio || '',
          consultationFee: data.consultationFee,
          experience: data.experience || 0,
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { data } = await doctorService.updateProfile(form);
      setProfile(data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Update failed');
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
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Consultation Fee ($)</label>
              <input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Experience (years)</label>
            <input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} maxLength={1000} />
          </div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      ) : (
        <div className="profile-display">
          <div className="profile-grid">
            <div><strong>Name:</strong> Dr. {profile.firstName} {profile.lastName}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Phone:</strong> {profile.phone}</div>
            <div><strong>Specialization:</strong> {profile.specialization}</div>
            <div><strong>Experience:</strong> {profile.experience} years</div>
            <div><strong>Consultation Fee:</strong> ${profile.consultationFee}</div>
            <div><strong>Verified:</strong> {profile.isVerified ? 'Yes' : 'Pending'}</div>
            <div><strong>Rating:</strong> {profile.rating?.average?.toFixed(1) || 'N/A'} ({profile.rating?.count || 0} reviews)</div>
          </div>
          {profile.bio && <p className="doctor-bio">{profile.bio}</p>}
          {profile.languages?.length > 0 && (
            <div className="tag-list">
              <strong>Languages:</strong> {profile.languages.map((l, i) => <span key={i} className="tag">{l}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
