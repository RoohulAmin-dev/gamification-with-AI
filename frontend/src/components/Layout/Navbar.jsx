import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onOpenMenu }) => {
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <button
            type="button"
            className="navbar-hamburger"
            onClick={onOpenMenu}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
          <NavLink to="/" className="navbar-logo">
            <span className="logo-mark">AI</span>
            <span className="logo-text">Learn</span>
          </NavLink>
        </div>

        <nav className="navbar-links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Home
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            History
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Progress
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            About
          </NavLink>
        </nav>

        <div className="navbar-actions" ref={profileRef}>
          <button
            type="button"
            className="navbar-profile"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
          >
            <span className="profile-avatar">
              {(user?.email?.[0] || 'U').toUpperCase()}
            </span>
            <span className="profile-email">{user?.email}</span>
            <span className="profile-chevron">▾</span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <span className="profile-avatar profile-avatar--lg">
                  {(user?.email?.[0] || 'U').toUpperCase()}
                </span>
                <div>
                  <div className="profile-dropdown-email">{user?.email}</div>
                  <div className="profile-dropdown-meta">Signed in</div>
                </div>
              </div>
              <button
                type="button"
                className="profile-dropdown-action"
                onClick={() => {
                  signOut();
                  setProfileOpen(false);
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
