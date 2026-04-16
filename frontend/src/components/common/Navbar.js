import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Healthcare Platform</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to={`/${user.role}/dashboard`}>Dashboard</Link>

            {user.role === 'patient' && (
              <Link to="/book-appointment">Book Appointment</Link>
            )}

            {user.role === 'doctor' && (
              <Link to="/doctor/dashboard">My Schedule</Link>
            )}

            <NotificationBell />

            <span className="user-info">{user.firstName || user.email}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
