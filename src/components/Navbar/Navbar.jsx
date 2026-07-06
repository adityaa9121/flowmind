import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css';

const NAV_SECTIONS = ['hero', 'features', 'about', 'contact'];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track scroll position for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section with IntersectionObserver
  useEffect(() => {
    if (location.pathname !== '/') return;

    const observers = [];
    NAV_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [location.pathname]);

  const scrollToSection = useCallback((sectionId) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, navigate]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (currentUser) {
      navigate('/dashboard');
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const navItems = [
    { label: 'Home', section: 'hero' },
    { label: 'Features', section: 'features' },
    { label: 'About', section: 'about' },
    { label: 'Contact', section: 'contact' },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        <a href="/" onClick={handleLogoClick} className={styles.logo}>
          <div className={styles.logoGlow}>
            <Sparkles className={styles.logoIcon} />
          </div>
          <span>FlowMind AI</span>
        </a>
        
        <nav className={styles.navLinks}>
          {navItems.map(item => (
            <button
              key={item.section}
              className={`${styles.link} ${activeSection === item.section && location.pathname === '/' ? styles.activeLink : ''}`}
              onClick={() => scrollToSection(item.section)}
            >
              {item.label}
              {activeSection === item.section && location.pathname === '/' && (
                <motion.div className={styles.activeIndicator} layoutId="activeNav" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
              )}
            </button>
          ))}
        </nav>

        <div className={styles.authButtons}>
          {currentUser ? (
            <Link to="/dashboard">
              <button className={styles.dashboardBtn}>
                Dashboard <ArrowRight size={16} />
              </button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <button className={styles.loginBtn}>Login</button>
              </Link>
              <Link to="/signup">
                <button className={styles.getStartedBtn}>
                  Get Started <ArrowRight size={16} />
                </button>
              </Link>
            </>
          )}
        </div>

        <button className={styles.mobileMenuBtn} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className={styles.mobileNav}>
              {navItems.map((item, i) => (
                <motion.button
                  key={item.section}
                  className={`${styles.mobileLink} ${activeSection === item.section ? styles.activeMobileLink : ''}`}
                  onClick={() => scrollToSection(item.section)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {item.label}
                </motion.button>
              ))}
              <div className={styles.mobileDivider} />
              {currentUser ? (
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <button className={styles.getStartedBtn} style={{ width: '100%' }}>
                    Dashboard <ArrowRight size={16} />
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <button className={styles.loginBtn} style={{ width: '100%' }}>Login</button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <button className={styles.getStartedBtn} style={{ width: '100%' }}>
                      Get Started <ArrowRight size={16} />
                    </button>
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
