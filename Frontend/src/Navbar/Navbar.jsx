import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className='head1'>
      <nav>
        <div className='logo-container'>
          <a className='logo' href='/'>
            CITY-MONITOR
          </a>
        </div>
        <img src='/logo.png' alt='logo' />
        <div className='right-container-navbar'>
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/analysis">Analysis</Link>
          <Link to="/about">About</Link>
          
          {user ? (
            <div className="dropdown">
              <button className="dropbtn">{user.name}</button>
              <div className="dropdown-content">
                <button onClick={logout}>Logout</button>
              </div>
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
