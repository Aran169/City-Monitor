import React, { useState, useEffect } from 'react';
import "./Navbar.css";
import { Link } from 'react-router-dom';

function Navbar() {
  const [user, setUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false); // State for toggling logout visibility

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user"); // Remove user data
    setUser(null); // Update state
    setShowLogout(false); // Hide the logout button after logging out
    window.location.reload(); // Refresh to update Navbar
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout); // Toggle visibility of logout button
  };

  return (
    <div className='head1'>
      <nav>
        <div className='logo-container'>
          <a className='logo' href='/'>CITY-MONITOR</a>
        </div>
        <img src='/logo.png' alt='logo' />
        <div className='right-container-navbar'>
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/analysis">Analysis</Link>
          <Link to="/about">About</Link>

          {user ? (
            <div className="dropdown">
              <span
                className="username"
                onClick={toggleLogout}
              >
                {user.fullName} {/* Display full name */}
              </span>
              {showLogout && (
                <span
                  onClick={handleLogout}
                  className={`logout-text ${showLogout ? 'visible' : ''}`}
                >
                  Logout
                </span>
              )}
            </div>
          ) : (
            <Link to='/login'>
              <button>Login</button>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
