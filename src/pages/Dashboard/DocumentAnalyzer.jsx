import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, List, MessageSquare, Send, Trash2, Edit2, Download, Search, } from 'lucide-react';
import Button from '../../components/Button/Button';
import RateLimitErrorCard from '../../components/RateLimitErrorCard/RateLimitErrorCard';
import { useAuth } from '../../context/AuthContext';
import styles from './DocumentAnalyzer.module.css';
import { API_BASE_URL } from '../../config/api';

const DocumentAnalyzer = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', parts: [{ text: "I've analyzed the document. Ask me any specific questions about it!" }] }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatRateLimitError, setChatRateLimitError] = useState(false);
  const [lastChatInput, setLastChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Sidebar History States
  const [documents, setDocuments] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [currentUser]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchDocuments = async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/documents/user/${currentUser.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    if (selected) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selected.type) && !selected.name.match(/\.(pdf|docx|txt)$/i)) {
        setError('Please upload a valid PDF, DOCX, or TXT file.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
      setAnalysis(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const selected = e.dataTransfer.files?.[0];
    validateAndSetFile(selected);
  };

  const getHeaders = async (isFormData = false) => {
    if (!currentUser) return isFormData ? {} : { 'Content-Type': 'application/json' };
    const token = await currentUser.getIdToken();
    if (isFormData) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleAnalyze = async () => {
    if (!file) return;

    if (isUploading) return;
    setIsUploading(true);
    setError('');
    setRateLimitError(false);

    const formData = new FormData();
    formData.append('file', file);
    if (currentUser) {
      formData.append('userId', currentUser.uid);
    }

    try {
      const headers = await getHeaders(true);
      const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data.error || 'Failed to analyze document.');
      }

      setAnalysis(data.analysis);
      setChatMessages([
        { role: 'model', parts: [{ text: `Luma has finished analyzing your document: "${data.analysis.title}". What would you like to know about it?` }] }
      ]);
      fetchDocuments(); // refresh list
    } catch (err) {
      if (err.message === 'RATE_LIMIT') setRateLimitError(true);
      else setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document?')) return;
    try {
      const headers = await getHeaders(false);
      const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d._id !== id));
        if (analysis && analysis.title === documents.find(d => d._id === id)?.title) {
          setAnalysis(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const saveEditDocument = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingDocId(null);
      return;
    }
    try {
      const headers = await getHeaders(false);
      const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => prev.map(d => d._id === id ? data : d));
        if (analysis && analysis.title === documents.find(d => d._id === id)?.title) {
          setAnalysis({ ...analysis, title: editTitle });
        }
      }
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setEditingDocId(null);
    }
  };

  const loadHistoricalDocument = (doc) => {
    setAnalysis({
      title: doc.title,
      summary: doc.summary,
      keyPoints: doc.keyPoints,
      actionItems: doc.actionItems,
      content: doc.content
    });
    setChatMessages([
      { role: 'model', parts: [{ text: `I've reopened the analysis for "${doc.title}". What would you like to know about it?` }] }
    ]);
  };

  const downloadAnalysis = (doc) => {
    const text = `
Analysis: ${doc.title}

Executive Summary:
${doc.summary}

Key Points:
${doc.keyPoints?.map(p => `- ${p}`).join('\n') || 'None'}

Action Items:
${doc.actionItems?.map(a => `- ${a}`).join('\n') || 'None'}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analysis_${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
  };

  const handleChatSubmit = async (e, retryText = null) => {
    if (e) e.preventDefault();
    const textToSubmit = retryText || chatInput;
    if (!textToSubmit.trim() || !analysis || isChatLoading) return;

    const userText = textToSubmit;
    if (!retryText) setChatInput('');
    setIsChatLoading(true);
    setChatRateLimitError(false);
    setLastChatInput(userText);

    const newMessages = [...chatMessages, { role: 'user', parts: [{ text: userText }] }];
    if (!retryText) setChatMessages(newMessages);

    try {
      // Provide the document content as a system instruction to ground the AI
      const systemInstruction = `You are Luma, an intelligent productivity companion helping a user understand a document. 
      Answer their questions based ONLY on the following document content:
      
      "${analysis.content.substring(0, 50000)}"
      
      If the answer is not in the document, say you don't know based on the provided text.`;

      const headers = await getHeaders(false);
      const res = await fetch(`${API_BASE_URL}/api/automations/document-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: newMessages,
          systemInstruction
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data.error || 'Failed to get answer');
      }

      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
    } catch (err) {
      console.error(err);
      if (err.message === 'RATE_LIMIT') {
        setChatRateLimitError(true);
        if (!retryText) setChatMessages(prev => prev.slice(0, -1)); // Remove optimistic message on rate limit so user can retry
      } else {
        setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: "Luma couldn't complete your request. Please try again." }] }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderSidebar = () => {
    const filteredDocs = documents.filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase()));
    return (
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={() => setAnalysis(null)}>
            <UploadCloud size={18} /> New Analysis
          </button>
        </div>
        
        <div className={styles.chatSearchWrapperSidebar}>
          <Search size={14} className={styles.chatSearchIcon} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            className={styles.chatSearchInputSidebar}
          />
        </div>

        <div className={styles.chatList}>
          {filteredDocs.map(doc => (
            <div 
              key={doc._id} 
              className={`${styles.chatListItem} ${analysis?.title === doc.title ? styles.activeChat : ''}`}
              onClick={() => loadHistoricalDocument(doc)}
            >
              <div className={styles.chatListTitle}>
                <FileText size={16} />
                {editingDocId === doc._id ? (
                  <form onSubmit={(e) => saveEditDocument(e, doc._id)} style={{width: '100%'}}>
                    <input 
                      type="text" 
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={styles.editChatInput}
                      onBlur={(e) => saveEditDocument(e, doc._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </form>
                ) : (
                  <span title={doc.title}>{doc.title}</span>
                )}
              </div>
              
              {!editingDocId && (
                <div className={styles.chatActionsSidebar}>
                  <button 
                    className={styles.sidebarActionBtn}
                    onClick={(e) => { e.stopPropagation(); downloadAnalysis(doc); }}
                    title="Download Analysis"
                  >
                    <Download size={14} />
                  </button>
                  <button 
                    className={styles.sidebarActionBtn}
                    onClick={(e) => { e.stopPropagation(); setEditingDocId(doc._id); setEditTitle(doc.title); }}
                    title="Rename"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className={styles.sidebarActionBtn}
                    onClick={(e) => deleteDocument(e, doc._id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {documents.length === 0 && (
            <div style={{padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
              No documents analyzed yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderSidebar()}
      
      <div className={styles.mainContentArea}>
        {!analysis ? (
          <div 
            className={`${styles.uploadSection} ${isDragActive ? styles.dragActive : ''}`}
            onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className={styles.uploadIcon} size={48} />
          <h2>Upload a Document</h2>
          <p>Drag & drop or click to upload PDF, DOCX, and TXT files up to 10MB.</p>
          
          <input 
            type="file" 
            id="file-upload" 
            className={styles.fileInput} 
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
          />
          <label htmlFor="file-upload" className={styles.uploadLabel}>
            Browse Files
          </label>
          
          {file && <div className={styles.selectedFile}>Selected: {file.name}</div>}
          
          {rateLimitError && <RateLimitErrorCard onRetry={handleAnalyze} />}
          {!rateLimitError && error && <div className={styles.error}>{error}</div>}

          {file && (
            <Button 
              className={styles.analyzeBtn} 
              onClick={handleAnalyze} 
              disabled={isUploading}
            >
              {isUploading ? 'Luma is analyzing your document...' : 'Analyze Document'}
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.workspace}>
          
          {/* Left Panel: Analysis Results */}
          <div className={styles.resultsPanel}>
            <div className={styles.panelHeader}>
              <FileText size={20} />
              <h3>Analysis Results: {analysis.title}</h3>
            </div>
            <div className={styles.panelContent}>
              
              <div className={styles.section}>
                <h4><List size={18} /> Executive Summary</h4>
                <p>{analysis.summary}</p>
              </div>

              {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                <div className={styles.section}>
                  <h4><CheckCircle size={18} /> Key Points</h4>
                  <ul className={styles.list}>
                    {analysis.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.actionItems && analysis.actionItems.length > 0 && (
                <div className={styles.section}>
                  <h4><CheckCircle size={18} color="var(--color-primary)" /> Action Items</h4>
                  <ul className={styles.list}>
                    {analysis.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>

          {/* Right Panel: Document Q&A Chat */}
          <div className={styles.chatPanel}>
            <div className={styles.panelHeader}>
              <MessageSquare size={20} />
              <h3>Document Q&A</h3>
            </div>
            
            <div className={styles.chatArea}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                  <div className={styles.messageContent}>
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className={`${styles.messageWrapper} ${styles.modelMessage}`}>
                  <div className={styles.messageContent}>Thinking...</div>
                </div>
              )}
              {chatRateLimitError && (
                <div style={{ marginTop: '1rem' }}>
                  <RateLimitErrorCard onRetry={() => handleChatSubmit(null, lastChatInput)} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className={styles.inputArea}>
              <input 
                type="text" 
                className={styles.chatInput} 
                placeholder="Ask a question about the document..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
              />
              <button type="submit" className={styles.sendBtn} disabled={!chatInput.trim() || isChatLoading}>
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      )}
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
