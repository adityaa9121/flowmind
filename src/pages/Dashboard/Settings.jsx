import { useState, useEffect } from 'react';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { Bell, Loader2, Check, Mail, FileText } from 'lucide-react';
import styles from './DashboardPages.module.css';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Settings = () => {
  const { currentUser, dbUser, updateDbUser } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (dbUser) {
      if (dbUser.preferences) {
        setEmailAlerts(dbUser.preferences.emailAlerts ?? true);
        setWeeklyDigest(dbUser.preferences.weeklyDigest ?? true);
      }
    }
  }, [dbUser]);

  const handleSave = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferences: {
            emailAlerts,
            weeklyDigest
          }
        })
      });

      if (!res.ok) throw new Error('Failed to save preferences');
      
      const updatedUser = await res.json();
      updateDbUser(updatedUser);

      setStatus({ type: 'success', message: 'Preferences saved successfully!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Preferences</h1>
        <p className={styles.pageSubtitle}>Customize your FlowMind AI experience to suit your workflow.</p>
      </header>

      <motion.div variants={itemVariants} initial="hidden" animate="show" style={{ maxWidth: '600px' }}>
        <Card>
          <h3 className={styles.sectionTitle} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem'}}>
            <Bell size={20} style={{color: 'var(--color-primary)'}}/> Notifications
          </h3>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer',
              padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)', transition: 'background-color 0.2s ease'
            }} className="hover-bg-light">
              <input 
                type="checkbox" 
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              /> 
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Mail size={16} /> Email Alerts
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Receive notifications when long-running automations or analysis tasks are finished.</div>
              </div>
            </label>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer',
              padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)', transition: 'background-color 0.2s ease'
            }} className="hover-bg-light">
              <input 
                type="checkbox" 
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              /> 
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <FileText size={16} /> Weekly Digest
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Get a summary of your AI productivity, time saved, and automated tasks every Monday.</div>
              </div>
            </label>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button onClick={handleSave} disabled={loading} style={{ minWidth: '160px' }}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Save Preferences'}
              </Button>
              
              {status.message && (
                <div style={{ 
                  color: status.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  {status.type === 'success' && <Check size={18} />}
                  {status.message}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .hover-bg-light:hover { background-color: var(--color-secondary-hover) !important; }
      `}</style>
    </div>
  );
};

export default Settings;
