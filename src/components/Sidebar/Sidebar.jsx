import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  HelpCircle,
  LogOut,
  Bot,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Automation Hub', path: '/dashboard/automation', icon: <Zap size={18} /> },
    { name: 'Luma', path: '/dashboard/chat', icon: <Bot size={18} /> },
    { name: 'Analyzer', path: '/dashboard/documents', icon: <FileText size={18} /> },
  ];

  const bottomItems = [
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
    { name: 'Help', path: '/help', icon: <HelpCircle size={18} /> },
  ];

  const renderNavItem = (item, isEnd = false) => {
    const isActive = isEnd 
      ? location.pathname === item.path 
      : location.pathname.startsWith(item.path);

    return (
      <li key={item.name} className={styles.navItemWrapper}>
        <NavLink 
          to={item.path} 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          end={isEnd}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className={styles.activeIndicator}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className={styles.iconWrapper}>{item.icon}</span>
          <span className={styles.navText}>{item.name}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <a href="/dashboard" className={styles.logo}>
          <div className={styles.logoIconWrapper}>
            <Sparkles className={styles.logoIcon} size={20} />
          </div>
          <span className={styles.logoText}>FlowMind</span>
        </a>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionTitle}>Menu</div>
        <ul className={styles.navList}>
          {renderNavItem(navItems[0], true)}
          {navItems.slice(1).map(item => renderNavItem(item))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <ul className={styles.navList}>
          {bottomItems.map(item => renderNavItem(item))}
          <li className={styles.navItemWrapper}>
            <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
              <span className={styles.iconWrapper}><LogOut size={18} /></span>
              <span className={styles.navText}>Log out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
