import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MobileDrawer = ({ open, onClose }) => {
  const { signOut } = useAuth();

  const handleNav = () => {
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'drawer-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`mobile-drawer ${open ? 'mobile-drawer--open' : ''}`} aria-label="Mobile navigation">
        <div className="drawer-header">
          <span className="logo-mark">AI</span>
          <span className="logo-text">Learn</span>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="drawer-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'drawer-link active' : 'drawer-link'}
            onClick={handleNav}
          >
            Home
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => isActive ? 'drawer-link active' : 'drawer-link'}
            onClick={handleNav}
          >
            History
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) => isActive ? 'drawer-link active' : 'drawer-link'}
            onClick={handleNav}
          >
            Progress
          </NavLink>
        </nav>

        <div className="drawer-footer">
          <button type="button" className="drawer-sign-out" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileDrawer;
