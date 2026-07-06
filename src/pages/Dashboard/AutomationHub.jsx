import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Mail, 
  FileText, 
  CheckSquare, 
  GitBranch, 
  ArrowLeft,
  Copy,
  Check,
  Save,
  Download,
  History,
  Trash2,
  Edit2,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '../../components/Button/Button';
import RateLimitErrorCard from '../../components/RateLimitErrorCard/RateLimitErrorCard';
import { useAuth } from '../../context/AuthContext';
import styles from './AutomationHub.module.css';

const AutomationHub = () => {
  const { currentUser } = useAuth();
  const [activeTool, setActiveTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form States
  const [emailData, setEmailData] = useState({ topic: '', tone: 'Professional', recipient: '', keyPoints: '' });
  const [notesData, setNotesData] = useState({ transcript: '' });
  const [taskData, setTaskData] = useState({ projectDescription: '' });
  const [workflowData, setWorkflowData] = useState({ processDescription: '' });

  // History States
  const [viewMode, setViewMode] = useState('generator'); // 'generator' | 'history'
  const [historyItems, setHistoryItems] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTool) {
      setViewMode('generator');
      setHistoryItems([]);
    }
  }, [activeTool]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    setLoadingHistory(true);
    setHistoryItems([]);
    try {
      const token = await currentUser.getIdToken();
      let endpoint = '';
      if (activeTool === 'email') endpoint = '/api/automations/emails';
      else if (activeTool === 'workflow') endpoint = '/api/automations/workflows';
      else if (activeTool === 'tasks') endpoint = '/api/automations/tasks';
      else {
        setLoadingHistory(false);
        return; // Notes doesn't have an explicit save model yet in the dummy implementation besides Activity
      }
      
      const res = await fetch(`\${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const token = await currentUser.getIdToken();
      let endpoint = '';
      if (activeTool === 'email') endpoint = `/api/automations/emails/${id}`;
      else if (activeTool === 'workflow') endpoint = `/api/automations/workflows/${id}`;
      else if (activeTool === 'tasks') endpoint = `/api/automations/tasks/${id}`;
      
      const res = await fetch(`\${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistoryItems(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const toggleViewMode = () => {
    if (viewMode === 'generator') {
      setViewMode('history');
      fetchHistory();
    } else {
      setViewMode('generator');
    }
  };

  const tools = [
    {
      id: 'email',
      name: 'Email Generator',
      description: 'Draft professional emails instantly based on a topic and tone.',
      icon: <Mail size={24} />,
      color: '#4F46E5'
    },
    {
      id: 'notes',
      name: 'Meeting Notes',
      description: 'Transform raw transcripts or messy bullets into structured meeting minutes.',
      icon: <FileText size={24} />,
      color: '#10B981'
    },
    {
      id: 'tasks',
      name: 'Task Breakdown',
      description: 'Break down large projects into actionable, trackable task lists.',
      icon: <CheckSquare size={24} />,
      color: '#F59E0B'
    },
    {
      id: 'workflow',
      name: 'Workflow Creator',
      description: 'Design automated business workflows based on plain text descriptions.',
      icon: <GitBranch size={24} />,
      color: '#8B5CF6'
    }
  ];

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleEditWorkflow = (item) => {
    setWorkflowData({
      processDescription: `Name: ${item.name}\nTrigger: ${item.trigger}\nAction: ${item.action}`
    });
    setViewMode('generator');
  };

  const handleDuplicateWorkflow = async (item) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('\/api/automations/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          processDescription: `Name: ${item.name} (Copy)\nTrigger: ${item.trigger}\nAction: ${item.action}`,
          userId: currentUser.uid
        })
      });
      if (res.ok) {
        fetchHistory(); // Refresh history
      }
    } catch (err) {
      console.error('Failed to duplicate workflow', err);
    } finally {
      setLoading(false);
    }
  };

  const getHeaders = async () => {
    if (!currentUser) return { 'Content-Type': 'application/json' };
    const token = await currentUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const generateEmail = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setRateLimitError(false); setResult(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('\/api/automations/email', {
        method: 'POST',
        headers,
        body: JSON.stringify(emailData)
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data.error);
      }
      setResult(data.result);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setRateLimitError(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNotes = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setRateLimitError(false); setResult(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('\/api/automations/meeting-notes', {
        method: 'POST',
        headers,
        body: JSON.stringify(notesData)
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data.error);
      }
      setResult(data.result);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setRateLimitError(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setRateLimitError(false); setResult(null); setSaved(false);
    try {
      const headers = await getHeaders();
      const res = await fetch('\/api/automations/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          projectDescription: taskData.projectDescription,
          userId: currentUser?.uid || 'guest'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data.error);
      }
      setResult(data.tasks); // It's an array of JSON objects
      setSaved(true);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setRateLimitError(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateWorkflow = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setRateLimitError(false); setResult(null); setSaved(false);
    try {
      const headers = await getHeaders();
      const res = await fetch('\/api/automations/workflow', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          processDescription: workflowData.processDescription,
          userId: currentUser?.uid || 'guest'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data.error);
      }
      setResult(data.workflow); // JSON object
      setSaved(true);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setRateLimitError(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderToolView = () => {
    const tool = tools.find(t => t.id === activeTool);
    if (!tool) return null;

    return (
      <div className={styles.toolView}>
        <div className={styles.toolHeader}>
          <button className={styles.backBtn} onClick={() => { setActiveTool(null); setResult(null); setRateLimitError(false); setError(''); }}>
            <ArrowLeft size={20} />
          </button>
          <h2>{tool.name}</h2>
          
          {(activeTool === 'email' || activeTool === 'workflow' || activeTool === 'tasks') && (
            <button 
              className={styles.historyToggleBtn} 
              onClick={toggleViewMode}
            >
              <History size={16} /> 
              {viewMode === 'generator' ? 'View History' : 'Back to Generator'}
            </button>
          )}
        </div>
        
        {viewMode === 'history' ? (
          <div className={styles.historyContainer}>
            <div className={styles.historySearchWrapper}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder={`Search past ${tool.name}s...`}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className={styles.historySearchInput}
              />
            </div>
            
            <div className={styles.historyList}>
              {loadingHistory ? (
                <div style={{padding: '2rem', textAlign: 'center'}}>Loading history...</div>
              ) : historyItems.filter(item => {
                const searchTxt = historySearch.toLowerCase();
                if (activeTool === 'email') return item.topic?.toLowerCase().includes(searchTxt);
                if (activeTool === 'workflow') return item.name?.toLowerCase().includes(searchTxt);
                if (activeTool === 'tasks') return item.title?.toLowerCase().includes(searchTxt);
                return true;
              }).length === 0 ? (
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No historical data found.</div>
              ) : (
                historyItems.filter(item => {
                  const searchTxt = historySearch.toLowerCase();
                  if (activeTool === 'email') return item.topic?.toLowerCase().includes(searchTxt);
                  if (activeTool === 'workflow') return item.name?.toLowerCase().includes(searchTxt);
                  if (activeTool === 'tasks') return item.title?.toLowerCase().includes(searchTxt);
                  return true;
                }).map(item => (
                  <div key={item._id} className={styles.historyCard}>
                    <div className={styles.historyCardHeader}>
                      <h4>{activeTool === 'email' ? item.topic : activeTool === 'workflow' ? item.name : item.title}</h4>
                      <div className={styles.historyActions}>
                        {activeTool === 'email' && (
                          <button className={styles.iconBtn} onClick={() => handleCopy(item.content)} title="Copy Email">
                            <Copy size={16} />
                          </button>
                        )}
                        {activeTool === 'workflow' && (
                          <>
                            <button className={styles.iconBtn} onClick={() => handleEditWorkflow(item)} title="Edit Workflow">
                              <Edit2 size={16} />
                            </button>
                            <button className={styles.iconBtn} onClick={() => handleDuplicateWorkflow(item)} title="Duplicate Workflow">
                              <Copy size={16} />
                            </button>
                          </>
                        )}
                        <button className={styles.iconBtn} onClick={() => deleteHistoryItem(item._id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className={styles.historyTime}>{new Date(item.createdAt).toLocaleString()}</p>
                    <div className={styles.historyPreview}>
                      {activeTool === 'email' && <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content?.substring(0, 200) + '...'}</ReactMarkdown>}
                      {activeTool === 'workflow' && <><p><strong>Trigger:</strong> {item.trigger}</p><p><strong>Action:</strong> {item.action}</p></>}
                      {activeTool === 'tasks' && <p>{item.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
        <div className={styles.toolContent}>
          {/* Form Area */}
          <div className={styles.formArea}>
            {activeTool === 'email' && (
              <form id="toolForm" onSubmit={generateEmail} style={{display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'}}>
                <div className={styles.formGroup}>
                  <label>Topic</label>
                  <input type="text" required value={emailData.topic} onChange={e => setEmailData({...emailData, topic: e.target.value})} placeholder="e.g. Project Update" />
                </div>
                <div className={styles.formGroup}>
                  <label>Tone</label>
                  <select value={emailData.tone} onChange={e => setEmailData({...emailData, tone: e.target.value})}>
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Urgent</option>
                    <option>Friendly</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Recipient (Optional)</label>
                  <input type="text" value={emailData.recipient} onChange={e => setEmailData({...emailData, recipient: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div className={styles.formGroup}>
                  <label>Key Points (Optional)</label>
                  <textarea value={emailData.keyPoints} onChange={e => setEmailData({...emailData, keyPoints: e.target.value})} placeholder="e.g. Completed phase 1, Need feedback by Friday" />
                </div>
                <Button type="submit" className={styles.generateBtn} disabled={loading}>{loading ? 'Luma is generating your response...' : 'Generate Email'}</Button>
              </form>
            )}

            {activeTool === 'notes' && (
              <form id="toolForm" onSubmit={generateNotes} style={{display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'}}>
                <div className={styles.formGroup} style={{flex: 1}}>
                  <label>Raw Transcript or Notes</label>
                  <textarea 
                    required 
                    value={notesData.transcript} 
                    onChange={e => setNotesData({...notesData, transcript: e.target.value})} 
                    placeholder="Paste your messy meeting notes or raw transcript here..."
                    style={{height: '100%', minHeight: '300px'}}
                  />
                </div>
                <Button type="submit" className={styles.generateBtn} disabled={loading}>{loading ? 'Luma is structuring notes...' : 'Format Notes'}</Button>
              </form>
            )}

            {activeTool === 'tasks' && (
              <form id="toolForm" onSubmit={generateTasks} style={{display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'}}>
                <div className={styles.formGroup} style={{flex: 1}}>
                  <label>Project / Goal Description</label>
                  <textarea 
                    required 
                    value={taskData.projectDescription} 
                    onChange={e => setTaskData({...taskData, projectDescription: e.target.value})} 
                    placeholder="Describe the project or goal you want to achieve..."
                    style={{height: '100%', minHeight: '200px'}}
                  />
                </div>
                <Button type="submit" className={styles.generateBtn} disabled={loading}>{loading ? 'Luma is preparing your tasks...' : 'Generate Tasks'}</Button>
              </form>
            )}

            {activeTool === 'workflow' && (
              <form id="toolForm" onSubmit={generateWorkflow} style={{display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'}}>
                <div className={styles.formGroup} style={{flex: 1}}>
                  <label>Process Description</label>
                  <textarea 
                    required 
                    value={workflowData.processDescription} 
                    onChange={e => setWorkflowData({...workflowData, processDescription: e.target.value})} 
                    placeholder="Describe the business process you want to automate. e.g. 'When a new lead fills out a form, send a welcome email and alert the sales team.'"
                    style={{height: '100%', minHeight: '200px'}}
                  />
                </div>
                <Button type="submit" className={styles.generateBtn} disabled={loading}>{loading ? 'Luma is preparing your workflow...' : 'Generate Workflow'}</Button>
              </form>
            )}

            {rateLimitError && (
              <RateLimitErrorCard onRetry={() => {
                if (activeTool === 'email') generateEmail();
                if (activeTool === 'notes') generateNotes();
                if (activeTool === 'tasks') generateTasks();
                if (activeTool === 'workflow') generateWorkflow();
              }} />
            )}
            {!rateLimitError && error && <div className={styles.error}>{error}</div>}
          </div>

          {/* Result Area */}
          <div className={styles.resultArea}>
            <div className={styles.resultHeader}>
              <h3>Result</h3>
              <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                {result && (typeof result === 'string') && (
                  <>
                    <button className={styles.copyBtn} onClick={() => handleCopy(result)}>
                      {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button className={styles.copyBtn} onClick={() => {
                      const blob = new Blob([result], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${activeTool}-result.txt`;
                      a.click();
                    }}>
                      <Download size={16} /> Download
                    </button>
                  </>
                )}
                {result && saved && (activeTool === 'tasks' || activeTool === 'workflow') && (
                  <span style={{color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '500'}}>
                    <Save size={16} /> Autosaved
                  </span>
                )}
              </div>
            </div>
            
            {!result && !loading && (
              <div className={styles.emptyResult}>
                <Sparkles size={32} />
                <p>Fill out the form and click generate.</p>
              </div>
            )}
            
            {loading && (
              <div className={styles.emptyResult}>
                <div className="loader" style={{borderTopColor: tool.color, width: '30px', height: '30px', borderWidth: '3px'}}></div>
                <p>Luma is working on it...</p>
              </div>
            )}

            {result && !loading && (
              <div className={styles.markdownResult}>
                {typeof result === 'string' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                ) : Array.isArray(result) ? (
                  <div>
                    {result.map((task, i) => (
                      <div key={i} className={styles.taskItem}>
                        <h4>{task.title}</h4>
                        <p>{task.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <h3 style={{marginTop: 0}}>{result.name}</h3>
                    <div className={styles.taskItem}>
                      <strong>Trigger:</strong> {result.trigger}
                    </div>
                    <div className={styles.taskItem}>
                      <strong>Action:</strong> {result.action}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {!activeTool ? (
        <>
          <div className={styles.header}>
            <div>
              <h1>Automation Hub</h1>
              <p>Accelerate your workflow with AI-powered generators.</p>
            </div>
          </div>

          <div className={styles.suggestionWidget}>
            <div className={styles.suggestionIcon}>
              <Sparkles size={24} />
            </div>
            <div className={styles.suggestionText}>
              <h4>Smart Productivity Tip</h4>
              <p>You have 3 unstructured notes from yesterday. Try running them through the <strong>Meeting Notes</strong> generator to extract action items!</p>
            </div>
          </div>

          <div className={styles.grid}>
            {tools.map(tool => (
              <div key={tool.id} className={styles.toolCard} onClick={() => setActiveTool(tool.id)}>
                <div className={styles.iconWrapper} style={{ backgroundColor: tool.color }}>
                  {tool.icon}
                </div>
                <div>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        renderToolView()
      )}
    </div>
  );
};

export default AutomationHub;
