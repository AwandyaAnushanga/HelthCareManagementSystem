import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    try {
      const { data } = await adminService.getAllAdmins();
      setAdmins(data.admins || []);
    } catch (err) {
      // manageAdmins permission may not be granted
      if (err.response?.status === 403) {
        setAdmins([]);
      } else {
        toast.error('Failed to load admins');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this admin?')) return;
    try {
      await adminService.deactivateAdmin(id);
      toast.success('Admin deactivated');
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await adminService.reactivateAdmin(id);
      toast.success('Admin reactivated');
      fetchAdmins();
    } catch (err) {
      toast.error('Failed to reactivate');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await adminService.updateAdmin(id, { role: newRole });
      toast.success('Role updated');
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (admins.length === 0) return <p className="empty-state">No access to admin management or no admins found.</p>;

  return (
    <div className="admin-management">
      <h2>Admin Accounts</h2>
      <div className="admin-list">
        {admins.map((admin) => (
          <div key={admin._id} className={`admin-card ${!admin.isActive ? 'inactive' : ''}`}>
            <div className="admin-info">
              <h3>{admin.firstName} {admin.lastName}</h3>
              <p>{admin.email}</p>
              <div className="admin-meta">
                <span className={`role-badge role-${admin.role}`}>{admin.role}</span>
                <span className={admin.isActive ? 'verified' : 'unverified'}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="action-buttons">
              <select
                value={admin.role}
                onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                className="role-select"
              >
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              {admin.isActive ? (
                <button onClick={() => handleDeactivate(admin._id)} className="btn btn-danger btn-sm">Deactivate</button>
              ) : (
                <button onClick={() => handleReactivate(admin._id)} className="btn btn-success btn-sm">Reactivate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminManagement;
