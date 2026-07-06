import { useState } from 'react';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { Book, MessageCircle, ExternalLink, X, Loader2, Check } from 'lucide-react';
import styles from './DashboardPages.module.css';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';

const Help = () => {
  const { currentUser, dbUser } = useAuth();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    priority: 'Medium'
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Auto-fill form when opening modal
  const handleOpenModal = () => {
    setFormData(prev => ({
      ...prev,
      name: dbUser?.name || currentUser?.displayName || '',
      email: currentUser?.email || ''
    }));
    setIsModalOpen(true);
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');
      
      setStatus({ type: 'success', message: 'Support ticket submitted successfully!' });
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Help & Support</h1>
        <p className={styles.pageSubtitle}>Learn how to master FlowMind AI.</p>
      </header>

      <div className={styles.grid2Col}>
        <Card>
          <h3 className={styles.sectionTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Book size={18} style={{color: 'var(--color-primary)'}}/> Documentation
          </h3>
          <p style={{color: 'var(--text-muted)', lineHeight: '1.6', margin: '1rem 0'}}>
            Read our quickstart guide to learn how to generate tasks, design workflows, and use the AI Document Analyzer efficiently to scale your productivity.
          </p>
          <Button variant="outline" onClick={() => setIsDocsOpen(true)} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            View Quickstart Guide <ExternalLink size={16} />
          </Button>
        </Card>

        <Card>
          <h3 className={styles.sectionTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <MessageCircle size={18} style={{color: 'var(--color-primary)'}}/> Contact Support
          </h3>
          <p style={{color: 'var(--text-muted)', lineHeight: '1.6', margin: '1rem 0'}}>
            Need help with a specific workflow or experiencing an issue? Our engineering team is available 24/7 to assist you.
          </p>
          <Button variant="primary" onClick={handleOpenModal}>Open Support Ticket</Button>
        </Card>
      </div>

      {/* Support Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modalContent}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h2>Submit a Support Ticket</h2>
                <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className={styles.modalForm}>
                <div className={styles.formGroupRow}>
                  <div className={styles.formGroup}>
                    <label>Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                
                <div className={styles.formGroupRow}>
                  <div className={styles.formGroup} style={{ flex: 2 }}>
                    <label>Subject</label>
                    <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Brief description of the issue" />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label>Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Please provide detailed information to help us solve your issue..." style={{ minHeight: '150px' }}></textarea>
                </div>

                <div className={styles.formGroup}>
                  <label>Attachment (Optional)</label>
                  <input type="file" />
                </div>

                <div className={styles.modalFooter}>
                  {status.message && (
                    <span style={{ 
                      color: status.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
                    }}>
                      {status.type === 'success' && <Check size={16} />}
                      {status.message}
                    </span>
                  )}
                  <div style={{ flex: 1 }}></div>
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading} style={{ minWidth: '120px' }}>
                    {loading ? <Loader2 size={18} className="spin" /> : 'Submit Ticket'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Documentation Modal */}
      <AnimatePresence>
        {isDocsOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modalContent}
              style={{ maxWidth: '800px', height: '80vh', overflowY: 'auto' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 10, padding: '1.5rem', margin: '-1.5rem -1.5rem 1.5rem -1.5rem', borderBottom: '1px solid var(--border-color)'}}>
                <h2>FlowMind Documentation</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="text" placeholder="Search documentation..." style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', outline: 'none' }} />
                  <button onClick={() => setIsDocsOpen(false)} className={styles.closeBtn}><X size={20} /></button>
                </div>
              </div>
              
              <div className={styles.docsContent}>
                <h3>Getting Started</h3>
                <p>Welcome to FlowMind! This documentation will help you get started with the core features of the platform.</p>
                <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
                
                <h3>Luma</h3>
                <p>Luma is your personal companion. You can access it by clicking "Start Chat" on the dashboard. It remembers the context of your conversation within a session.</p>
                <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
                
                <h3>Document Analyzer</h3>
                <p>Upload a PDF, DOCX, or TXT file to instantly extract an executive summary, key points, and action items. Once analyzed, you can chat directly with the document on the right side panel.</p>
                <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
                
                <h3>Automation Hub</h3>
                <p>The hub contains multiple generators:</p>
                <ul>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Email Generator:</strong> Draft professional emails quickly.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Meeting Notes:</strong> Turn messy transcripts into structured minutes.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Task Breakdown:</strong> Convert large goals into actionable JSON task arrays.</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Workflow Creator:</strong> Design logic triggers and actions based on plain text.</li>
                </ul>
                <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
                
                <h3>FAQ</h3>
                <p><strong>Q: Are my documents private?</strong><br/>A: Yes, documents are processed in memory and immediately discarded. Only the extracted analysis is returned to you.</p>
                <p><strong>Q: What AI model is used?</strong><br/>A: We use Google's state of the art Gemini 2.5 Flash model for incredibly fast and accurate generations.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Help;
