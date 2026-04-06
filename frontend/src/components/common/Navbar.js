import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const role = JSON.parse(localStorage.getItem('user'))?.role || user.role;
    return `/${role}/dashboard`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Healthcare Platform</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to={getDashboardLink()}>Dashboard</Link>
            <Link to="/book-appointment">Book Appointment</Link>
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
