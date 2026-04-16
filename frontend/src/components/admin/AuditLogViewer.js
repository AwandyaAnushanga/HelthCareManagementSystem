import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formatDate';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    source: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const { data } = await adminService.getAuditLogs(params);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const severityColor = (severity) => {
    const colors = { info: '#2563eb', warning: '#f59e0b', error: '#dc2626', critical: '#7c2d12' };
    return colors[severity] || '#64748b';
  };

  return (
    <div className="audit-viewer">
      <h2>Audit Logs</h2>

      <div className="audit-filters">
        <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          <option value="authentication">Authentication</option>
          <option value="appointment">Appointment</option>
          <option value="user_management">User Management</option>
          <option value="medical">Medical</option>
          <option value="notification">Notification</option>
          <option value="system">System</option>
        </select>
        <select value={filters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)} className="filter-select">
          <option value="">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select value={filters.source} onChange={(e) => handleFilterChange('source', e.target.value)} className="filter-select">
          <option value="">All Sources</option>
          <option value="patient-service">Patient Service</option>
          <option value="doctor-service">Doctor Service</option>
          <option value="appointment-service">Appointment Service</option>
          <option value="admin-service">Admin Service</option>
          <option value="notification-service">Notification Service</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="Start date"
          className="filter-date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="End date"
          className="filter-date"
        />
      </div>

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <p className="empty-state">No audit logs found.</p>
      ) : (
        <>
          <div className="audit-table">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{formatDateTime(log.timestamp || log.createdAt)}</td>
                    <td><code>{log.eventType}</code></td>
                    <td>{log.category}</td>
                    <td>
                      <span className="severity-badge" style={{ backgroundColor: severityColor(log.severity) }}>
                        {log.severity}
                      </span>
                    </td>
                    <td>{log.source}</td>
                    <td>{log.actor?.email || log.actor?.userId || 'system'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default AuditLogViewer;
