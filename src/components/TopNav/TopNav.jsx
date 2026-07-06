import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User, LogOut, FileText, MessageSquare, CheckSquare, GitBranch, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../Dropdown/Dropdown';
import { useNavigate, Link } from 'react-router-dom';
import styles from './TopNav.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const TopNav = () => {
  const { currentUser, dbUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('\/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, [currentUser]);

  useEffect(() => {
    // Handle Search
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const debounce = setTimeout(async () => {
      if (!currentUser) return;
      setIsSearching(true);
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`\/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearch(true);
        }
      } catch (error) {
        console.error('Search error', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, currentUser]);

  // Click outside to close search & notifs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = await currentUser.getIdToken();
      await fetch(`\/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await currentUser.getIdToken();
      await fetch(`\/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = await currentUser.getIdToken();
      await fetch(`\/api/notifications/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
      setShowNotifications(false);
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  };

  const profileMenuItems = [
    { label: 'Profile Settings', onClick: () => navigate('/profile') },
    { label: 'Account Preferences', onClick: () => navigate('/settings') },
    { label: 'Log out', icon: <LogOut size={16} />, onClick: handleLogout }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'Chat': return <MessageSquare size={16} />;
      case 'Document': return <FileText size={16} />;
      case 'Workflow': return <GitBranch size={16} />;
      case 'Task': return <CheckSquare size={16} />;
      case 'Email': return <Mail size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn}>
          <Menu size={20} />
        </button>
        <div className={styles.searchBar} ref={searchRef}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tasks, notes, etc..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchResults.length > 0) setShowSearch(true); }}
          />
          
          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearch && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={styles.dropdownPanel}
                style={{ top: '100%', left: 0, width: '100%', marginTop: '0.5rem' }}
              >
                {isSearching ? (
                  <div className={styles.dropdownEmpty}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className={styles.searchList}>
                    {searchResults.map((result) => (
                      <Link 
                        key={result.id} 
                        to={result.link} 
                        className={styles.searchItem}
                        onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                      >
                        <span style={{ color: 'var(--color-primary)' }}>{getIconForType(result.type)}</span>
                        <div className={styles.searchItemContent}>
                          <span className={styles.searchItemTitle}>{result.title}</span>
                          <span className={styles.searchItemType}>{result.type}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={styles.dropdownEmpty}>No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className={styles.right}>
        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className={styles.iconBtn} 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}></span>}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={styles.dropdownPanel}
                style={{ top: '100%', right: 0, width: '320px', marginTop: '0.5rem' }}
              >
                <div className={styles.dropdownHeader}>
                  <h4>Notifications</h4>
                  {notifications.length > 0 && (
                    <div className={styles.dropdownActions}>
                      <button onClick={markAllRead} className={styles.textBtn}>Mark all read</button>
                      <button onClick={clearAllNotifications} className={styles.textBtn}>Clear</button>
                    </div>
                  )}
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.dropdownEmpty}>No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                        onClick={() => { if(!notif.read) markAsRead(notif._id); if(notif.link) navigate(notif.link); setShowNotifications(false); }}
                      >
                        <div className={styles.notificationContent}>
                          <span className={styles.notificationTitle}>{notif.title}</span>
                          <span className={styles.notificationMessage}>{notif.message}</span>
                          <span className={styles.notificationTime}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                        {!notif.read && <div className={styles.unreadDot}></div>}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Profile Dropdown */}
        <Dropdown 
          align="right"
          trigger={
            <div className={styles.profileBtn}>
              <div className={styles.avatar}>
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{dbUser?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}</span>
                <span className={styles.userRole}>Pro Plan</span>
              </div>
            </div>
          }
          items={profileMenuItems}
        />
      </div>
    </header>
  );
};

export default TopNav;
