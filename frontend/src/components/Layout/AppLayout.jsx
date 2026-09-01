import { useState } from 'react';
import Navbar from './Navbar';
import MobileDrawer from './MobileDrawer';

const AppLayout = ({ children }) => {
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
