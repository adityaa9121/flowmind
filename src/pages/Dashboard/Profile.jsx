import { useState, useEffect, useRef } from 'react';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { User, Shield, Loader2, Check, Zap, CheckCircle2, Clock, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './DashboardPages.module.css';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Profile = () => {
  const { currentUser, dbUser, updateUserProfile, updateUserPassword } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const [stats, setStats] = useState({ tasksAutomated: 0, completedNotes: 0, hoursSaved: 0, emailsGenerated: 0, workflowsCreated: 0, aiChats: 0 });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (currentUser) {
      setName(dbUser?.name || currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser, dbUser]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [statsRes, activityRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/stats`, { headers }),
          fetch(`${API_BASE_URL}/api/activities/user/${currentUser.uid}`, { headers })
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData.slice(0, 5)); // Only show top 5 on profile
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await updateUserProfile({ displayName: name });
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await updateUserPassword(password);
      setPassword('');
      setStatus({ type: 'success', message: 'Password updated successfully!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Avatar image must be less than 2MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        await updateUserProfile({ photoURL: reader.result });
        setStatus({ type: 'success', message: 'Avatar updated successfully!' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } catch (err) {
        setStatus({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profile</h1>
        <p className={styles.pageSubtitle}>Manage your personal information and view your activity.</p>
      </header>

      {/* Avatar Header */}
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <Card style={{display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem'}}>
          <div 
            style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--btn-gradient)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)', position: 'relative', cursor: 'pointer', overflow: 'hidden'
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Click to change avatar"
          >
            {loading ? <Loader2 size={24} className="spin" /> : currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
              name.charAt(0).toUpperCase() || 'U'
            )}
            <div style={{position: 'absolute', bottom: 0, background: 'rgba(0,0,0,0.5)', width: '100%', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <Settings size={12} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </div>
          <div>
            <h2 style={{margin: '0 0 0.5rem', fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)'}}>
              {name || 'User'}
            </h2>
            <p style={{margin: 0, color: 'var(--text-muted)'}}>{email}</p>
          </div>
          <Link to="/settings" style={{marginLeft: 'auto', textDecoration: 'none'}}>
            <Button variant="outline" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Settings size={16} /> Preferences
            </Button>
          </Link>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--color-primary)', backgroundColor: 'var(--bg-hover)' }}>
            <Zap size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Tasks Automated</p>
            <h3 className={styles.statValue}>
              {dataLoading ? <Loader2 size={20} className="spin" /> : stats.tasksAutomated}
            </h3>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-secondary)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Completed Notes</p>
            <h3 className={styles.statValue}>
              {dataLoading ? <Loader2 size={20} className="spin" /> : stats.completedNotes}
            </h3>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#8B5CF6', backgroundColor: 'var(--color-secondary)' }}>
            <Zap size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Emails Generated</p>
            <h3 className={styles.statValue}>
              {dataLoading ? <Loader2 size={20} className="spin" /> : stats.emailsGenerated}
            </h3>
          </div>
        </Card>
        
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#F59E0B', backgroundColor: 'var(--color-secondary)' }}>
            <Zap size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Workflows</p>
            <h3 className={styles.statValue}>
              {dataLoading ? <Loader2 size={20} className="spin" /> : stats.workflowsCreated}
            </h3>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#6D5EF5', backgroundColor: 'var(--bg-hover)' }}>
            <User size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>AI Chats</p>
            <h3 className={styles.statValue}>
              {dataLoading ? <Loader2 size={20} className="spin" /> : stats.aiChats}
            </h3>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: 'var(--color-warning)', backgroundColor: 'var(--color-secondary)' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Hours Saved</p>
            <h3 className={styles.statValue}>
              {dataLoading ? <Loader2 size={20} className="spin" /> : stats.hoursSaved}
            </h3>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} initial="hidden" animate="show" className={styles.grid2Col}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <Card>
            <h3 className={styles.sectionTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><User size={18} style={{color: 'var(--color-primary)'}}/> Personal Info</h3>
            <form className={styles.form} onSubmit={handleUpdateProfile} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem'}}>
              <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
              <Button variant="primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', minWidth: '150px' }}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
              </Button>
            </form>
          </Card>

          <Card>
            <h3 className={styles.sectionTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Shield size={18} style={{color: 'var(--color-primary)'}}/> Contact & Security</h3>
            <form className={styles.form} onSubmit={handleUpdateSecurity} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem'}}>
              <Input label="Email Address" type="email" value={email} disabled />
              <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
              <Button variant="outline" type="submit" disabled={loading || !password} style={{ alignSelf: 'flex-start', minWidth: '200px' }}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Update Security Info'}
              </Button>
              
              {status.message && (
                <span style={{ 
                  color: status.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
                }}>
                  {status.type === 'success' && <Check size={16} />}
                  {status.message}
                </span>
              )}
            </form>
          </Card>
        </div>

        <Card className={styles.recentSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 className={styles.sectionTitle} style={{margin: 0}}>Recent Activity</h3>
            <Link to="/dashboard" style={{color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px'}}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className={styles.activityList}>
            {dataLoading ? (
              <div style={{display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)'}}>
                <Loader2 size={24} className="spin" />
              </div>
            ) : activities.length === 0 ? (
              <div style={{padding: '2rem 1rem', color: 'var(--text-muted)', textAlign: 'center'}}>
                <p>No activity yet.</p>
              </div>
            ) : (
              activities.map(activity => (
                <div key={activity._id} className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityContent}>
                    <p><strong>{activity.action}</strong></p>
                    <p style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>{activity.details}</p>
                    <span className={styles.activityTime}>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Profile;
