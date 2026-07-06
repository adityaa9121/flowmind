import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import TopNav from '../components/TopNav/TopNav';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/dashboard/chat';

  return (
    <div className={styles.layout}>
      {/* Premium animated background elements */}
      <div className={styles.leftGlow} />
      <div className={styles.rightGlow} />
      
      <div className={styles.particles}>
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className={styles.particle} 
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
              width: `${4 + Math.random() * 4}px`,
              height: `${4 + Math.random() * 4}px`,
            }} 
          />
        ))}
      </div>

      <Sidebar />
      <div className={styles.contentWrapper}>
        <TopNav />
        <main
          className={`${styles.mainContent} page-transition`}
          style={isChatPage ? { overflow: 'hidden', padding: '1rem' } : undefined}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
