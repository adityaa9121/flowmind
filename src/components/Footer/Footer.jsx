import { Link } from 'react-router-dom';
import { Sparkles, Mail } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandInfo}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoSquare}>
              <Sparkles size={16} />
            </div>
            <span>FlowMind AI</span>
          </Link>
          <p className={styles.description}>
            The intelligent workflow assistant that helps you automate daily business tasks using Gemini AI.
          </p>
        </div>

        <div className={styles.linksGroup}>
          <h4 className={styles.linksTitle}>Product</h4>
          <button onClick={() => scrollTo('features')} className={styles.link}>Features</button>
          <button onClick={() => scrollTo('about')} className={styles.link}>About</button>
          <button onClick={() => scrollTo('contact')} className={styles.link}>Contact</button>
        </div>

        <div className={styles.linksGroup}>
          <h4 className={styles.linksTitle}>Resources</h4>
          <Link to="/signup" className={styles.link}>Get Started</Link>
          <Link to="/login" className={styles.link}>Sign In</Link>
          <a href="mailto:support@flowmind.ai" className={styles.link}>Help Center</a>
        </div>

        <div className={styles.linksGroup}>
          <h4 className={styles.linksTitle}>Get in Touch</h4>
          <p className={styles.contactText}>Have questions? We're here to help you get started.</p>
          <a href="mailto:support@flowmind.ai" className={styles.contactBtn}>
            <Mail size={16} />
            support@flowmind.ai
          </a>
        </div>
      </div>
      <div className={`container ${styles.bottomBar}`}>
        <p>&copy; {new Date().getFullYear()} FlowMind AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
