import { useState, useEffect } from 'react';
import Card from '../../components/Card/Card';
import { CheckCircle2, Clock, Zap, Bot, ArrowRight, Loader2, Sparkles, FileText, Mail, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import styles from './DashboardPages.module.css';
import { useAuth } from '../../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, dbUser } = useAuth();
  const [stats, setStats] = useState({ tasksAutomated: 0, completedNotes: 0, hoursSaved: 0, emailsGenerated: 0, workflowsCreated: 0, aiChats: 0 });
  const [activities, setActivities] = useState([]);
  
  // New State for Dashboard Overhaul
  const [recentChats, setRecentChats] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [recentEmails, setRecentEmails] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [statsRes, activityRes, chatsRes, docsRes, workflowsRes, emailsRes] = await Promise.all([
          fetch('\/api/users/stats', { headers }),
          fetch(`\/api/activities/user/${currentUser.uid}`, { headers }),
          fetch(`\/api/chats/user/${currentUser.uid}`, { headers }),
          fetch(`\/api/documents/user/${currentUser.uid}`, { headers }),
          fetch('\/api/automations/workflows', { headers }),
          fetch('\/api/automations/emails', { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (activityRes.ok) setActivities(await activityRes.json());
        if (chatsRes.ok) setRecentChats((await chatsRes.json()).slice(0, 3));
        if (docsRes.ok) setRecentDocs((await docsRes.json()).slice(0, 3));
        if (workflowsRes.ok) setRecentWorkflows((await workflowsRes.json()).slice(0, 3));
        if (emailsRes.ok) setRecentEmails((await emailsRes.json()).slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, dbUser]);

  return (
    <motion.div 
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Welcome back, {dbUser?.name?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User'}!</h1>
        <p className={styles.pageSubtitle}>Here's a snapshot of your AI automation performance.</p>
      </motion.header>

      <motion.div variants={itemVariants} className={styles.quickActionsGrid}>
        <Link to="/dashboard/chat?new=true" className={`${styles.quickActionCard} hover-glow`}>
          <div className={styles.quickActionIcon} style={{ background: 'var(--btn-gradient)' }}><Bot size={20} /></div>
          <span>New Chat</span>
        </Link>
        <Link to="/dashboard/automation" className={styles.quickActionCard}>
          <div className={styles.quickActionIcon} style={{ background: 'var(--btn-gradient)' }}><Zap size={20} /></div>
          <span>Run Workflow</span>
        </Link>
        <Link to="/dashboard/documents" className={styles.quickActionCard}>
          <div className={styles.quickActionIcon} style={{ background: 'var(--btn-gradient)' }}><CheckCircle2 size={20} /></div>
          <span>Analyze Doc</span>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className={styles.statsGrid}>
        <Link to="/dashboard/automation" style={{textDecoration: 'none'}}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: 'var(--color-primary)', backgroundColor: 'var(--bg-hover)' }}>
              <Zap size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Tasks Automated</p>
              <h3 className={styles.statValue}>
                {loading ? <Loader2 size={20} className="spin" /> : stats.tasksAutomated}
              </h3>
            </div>
          </Card>
        </Link>
        
        <Link to="/dashboard/documents" style={{textDecoration: 'none'}}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-secondary)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Completed Notes</p>
              <h3 className={styles.statValue}>
                {loading ? <Loader2 size={20} className="spin" /> : stats.completedNotes}
              </h3>
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/automation" style={{textDecoration: 'none'}}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#8B5CF6', backgroundColor: 'var(--color-secondary)' }}>
              <Zap size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Emails Generated</p>
              <h3 className={styles.statValue}>
                {loading ? <Loader2 size={20} className="spin" /> : stats.emailsGenerated}
              </h3>
            </div>
          </Card>
        </Link>
        
        <Link to="/dashboard/automation" style={{textDecoration: 'none'}}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#F59E0B', backgroundColor: 'var(--color-secondary)' }}>
              <Zap size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Workflows</p>
              <h3 className={styles.statValue}>
                {loading ? <Loader2 size={20} className="spin" /> : stats.workflowsCreated}
              </h3>
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/chat" style={{textDecoration: 'none'}}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#6D5EF5', backgroundColor: 'var(--bg-hover)' }}>
              <Bot size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>AI Chats</p>
              <h3 className={styles.statValue}>
                {loading ? <Loader2 size={20} className="spin" /> : stats.aiChats}
              </h3>
            </div>
          </Card>
        </Link>

        <Link to="/dashboard" style={{textDecoration: 'none'}}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: 'var(--color-warning)', backgroundColor: 'var(--color-secondary)' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Hours Saved</p>
              <h3 className={styles.statValue}>
                {loading ? <Loader2 size={20} className="spin" /> : stats.hoursSaved}
              </h3>
            </div>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className={styles.grid2Col} style={{ marginTop: '1rem' }}>
        
        {/* Today's Activity / Recent Activity */}
        <Card className={styles.recentSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 className={styles.sectionTitle} style={{margin: 0}}>Activity Feed</h3>
          </div>
          
          <div className={styles.activityList} style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)'}}>
                <Loader2 size={24} className="spin" />
              </div>
            ) : activities.length === 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', textAlign: 'center'}}>
                <Sparkles size={32} style={{marginBottom: '1rem', color: 'var(--border-focus)'}} />
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

        {/* Recent AI Conversations */}
        <Card className={styles.recentSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 className={styles.sectionTitle} style={{margin: 0}}><Bot size={18} style={{marginRight: '8px'}}/> Recent Chats</h3>
            <Link to="/dashboard/chat" style={{fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none'}}>View all</Link>
          </div>
          <div className={styles.activityList}>
            {loading ? (
              <div style={{textAlign: 'center'}}><Loader2 size={20} className="spin" /></div>
            ) : recentChats.length === 0 ? (
              <p style={{color: 'var(--text-muted)', textAlign: 'center'}}>No recent chats.</p>
            ) : (
              recentChats.map(chat => (
                <div key={chat._id} className={styles.compactCard} onClick={() => navigate('/dashboard/chat')}>
                  <div style={{flex: 1, overflow: 'hidden'}}>
                    <p style={{margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{chat.title}</p>
                    <p style={{margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{new Date(chat.updatedAt).toLocaleString()}</p>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              ))
            )}
          </div>
        </Card>

      </motion.div>

      <motion.div variants={itemVariants} className={styles.grid3Col} style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Recently Uploaded Documents */}
        <Card className={styles.recentSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 className={styles.sectionTitle} style={{margin: 0}}><FileText size={18} style={{marginRight: '8px'}}/> Recent Documents</h3>
            <Link to="/dashboard/documents" style={{fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none'}}>View all</Link>
          </div>
          <div className={styles.activityList}>
            {loading ? (
              <div style={{textAlign: 'center'}}><Loader2 size={20} className="spin" /></div>
            ) : recentDocs.length === 0 ? (
              <p style={{color: 'var(--text-muted)', textAlign: 'center'}}>No recent documents.</p>
            ) : (
              recentDocs.map(doc => (
                <div key={doc._id} className={styles.compactCard} onClick={() => navigate('/dashboard/documents')}>
                  <div style={{flex: 1, overflow: 'hidden'}}>
                    <p style={{margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{doc.title}</p>
                    <p style={{margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Workflows */}
        <Card className={styles.recentSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 className={styles.sectionTitle} style={{margin: 0}}><Settings size={18} style={{marginRight: '8px'}}/> Recent Workflows</h3>
            <Link to="/dashboard/automation" style={{fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none'}}>View all</Link>
          </div>
          <div className={styles.activityList}>
            {loading ? (
              <div style={{textAlign: 'center'}}><Loader2 size={20} className="spin" /></div>
            ) : recentWorkflows.length === 0 ? (
              <p style={{color: 'var(--text-muted)', textAlign: 'center'}}>No recent workflows.</p>
            ) : (
              recentWorkflows.map(wf => (
                <div key={wf._id} className={styles.compactCard} onClick={() => navigate('/dashboard/automation')}>
                  <div style={{flex: 1, overflow: 'hidden'}}>
                    <p style={{margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{wf.name}</p>
                    <p style={{margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{new Date(wf.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Emails */}
        <Card className={styles.recentSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 className={styles.sectionTitle} style={{margin: 0}}><Mail size={18} style={{marginRight: '8px'}}/> Recent Emails</h3>
            <Link to="/dashboard/automation" style={{fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none'}}>View all</Link>
          </div>
          <div className={styles.activityList}>
            {loading ? (
              <div style={{textAlign: 'center'}}><Loader2 size={20} className="spin" /></div>
            ) : recentEmails.length === 0 ? (
              <p style={{color: 'var(--text-muted)', textAlign: 'center'}}>No recent emails.</p>
            ) : (
              recentEmails.map(email => (
                <div key={email._id} className={styles.compactCard} onClick={() => navigate('/dashboard/automation')}>
                  <div style={{flex: 1, overflow: 'hidden'}}>
                    <p style={{margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{email.topic}</p>
                    <p style={{margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{new Date(email.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
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
    </motion.div>
  );
};

export default Dashboard;
