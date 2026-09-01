import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useProgress from '../../hooks/useProgress';

const Navbar = ({ onOpenMenu }) => {
  const { user, signOut, displayName } = useAuth();
  const { state: progressState } = useProgress();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const streakValue = typeof progressState.streak === 'object' && progressState.streak !== null
    ? Number(progressState.streak.current || 0)
    : Number(progressState.streak || 0);

  const xpValue = Number(progressState.xp || 0);

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

        <div className="navbar-stats">
          <div className="stat-badge">
            <span className="stat-icon">⚡</span>
            <span className="stat-value">{xpValue}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-icon">🔥</span>
            <span className={`stat-value ${streakValue > 0 ? 'active' : ''}`}>{streakValue}</span>
          </div>
        </div>

        <div className="navbar-actions" ref={profileRef}>
          <button
            type="button"
            className="navbar-profile"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
          >
            <span className="profile-avatar">
              {(displayName || 'U')[0].toUpperCase()}
            </span>
            <span className="profile-email">{displayName}</span>
            <span className="profile-chevron">▾</span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <span className="profile-avatar profile-avatar--lg">
                  {(displayName || 'U')[0].toUpperCase()}
                </span>
                <div>
                  <div className="profile-dropdown-email">{displayName}</div>
                  <div className="profile-dropdown-meta">{user?.email}</div>
                </div>
              </div>
              <NavLink
                to="/profile"
                className="profile-dropdown-action"
                onClick={() => setProfileOpen(false)}
              >
                Profile
              </NavLink>
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
