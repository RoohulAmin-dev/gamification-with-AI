import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import MobileDrawer from './MobileDrawer';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="app-layout">
      <Navbar onOpenMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
