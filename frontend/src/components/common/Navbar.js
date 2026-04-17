import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">+</span>
          <span className="brand-text">HealthCare</span>
        </Link>

        {user && (
          <div className="nav-links">
            <Link to={`/${user.role}/dashboard`} className={`nav-link ${isActive(`/${user.role}/dashboard`) ? 'active' : ''}`}>
              Dashboard
            </Link>

            {user.role === 'patient' && (
              <Link to="/book-appointment" className={`nav-link ${isActive('/book-appointment') ? 'active' : ''}`}>
                Book Appointment
              </Link>
            )}

            {user.role === 'doctor' && (
              <Link to="/doctor/dashboard" className={`nav-link ${isActive('/doctor/dashboard') ? 'active' : ''}`}>
                My Schedule
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <div className="user-menu">
              <div className="user-avatar">{user.firstName?.charAt(0)?.toUpperCase() || 'U'}</div>
              <span className="user-name">{user.firstName || user.email}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
