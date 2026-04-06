import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <h1>Smart Healthcare Platform</h1>
      <p>Book appointments, consult doctors, and manage your health — all in one place.</p>
      <div className="home-actions">
        <Link to="/register" className="btn btn-primary">Get Started</Link>
        <Link to="/login" className="btn btn-secondary">Sign In</Link>
      </div>
    </div>
  );
};

export default HomePage;
