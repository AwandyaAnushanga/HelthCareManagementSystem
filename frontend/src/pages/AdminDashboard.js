import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import DoctorManagement from '../components/admin/DoctorManagement';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import AdminManagement from '../components/admin/AdminManagement';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'doctors', label: 'Doctors' },
  { key: 'audit', label: 'Audit Logs' },
  { key: 'admins', label: 'Admin Accounts' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab !== 'overview') return;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data } = await adminService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [activeTab]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            {loading ? (
              <div className="loading">Loading analytics...</div>
            ) : analytics ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>{analytics.totalAuditEvents || 0}</h3>
                    <p>Total Events</p>
                  </div>
                  {analytics.appointmentStats && (
                    <>
                      <div className="stat-card">
                        <h3>{analytics.appointmentStats.total || 0}</h3>
                        <p>Total Appointments</p>
                      </div>
                      <div className="stat-card stat-highlight">
                        <h3>{analytics.appointmentStats.todayActive || 0}</h3>
                        <p>Active Today</p>
                      </div>
                    </>
                  )}
                </div>

                {analytics.eventBreakdown?.length > 0 && (
                  <div className="analytics-section">
                    <h2>Event Breakdown</h2>
                    <div className="event-breakdown">
                      {analytics.eventBreakdown.map((e) => (
                        <span key={e._id} className="event-badge">{e._id}: {e.count}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.recentEvents?.length > 0 && (
                  <div className="analytics-section">
                    <h2>Recent Activity</h2>
                    <div className="recent-events">
                      {analytics.recentEvents.slice(0, 10).map((event) => (
                        <div key={event._id} className="event-item">
                          <code>{event.eventType}</code>
                          <span className="event-source">{event.source}</span>
                          <span className="event-time">{new Date(event.timestamp || event.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="empty-state">No analytics data available.</p>
            )}
          </div>
        )}

        {activeTab === 'doctors' && <DoctorManagement />}
        {activeTab === 'audit' && <AuditLogViewer />}
        {activeTab === 'admins' && <AdminManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;
