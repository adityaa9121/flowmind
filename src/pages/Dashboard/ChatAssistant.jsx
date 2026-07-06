import { useState, useRef, useEffect } from 'react';
import { User, Send, Copy, RefreshCw, Check, Plus, MessageSquare, Trash2, Zap, Sparkles, Search, Pin, Edit2, MoreVertical, X, } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../../context/AuthContext';
import RateLimitErrorCard from '../../components/RateLimitErrorCard/RateLimitErrorCard';
import styles from './ChatAssistant.module.css';
import { API_BASE_URL } from '../../config/api';

const ChatAssistant = () => {
  const { currentUser } = useAuth();
  
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sidebar states
  const [chatSearch, setChatSearch] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
  const chatAreaRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch all chats on load
  useEffect(() => {
    fetchChats();
  }, [currentUser]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Fetch messages when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const getHeaders = async () => {
    const token = await currentUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchChats = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/api/chat`, { headers });
      const data = await res.json();
      if (res.ok) {
        setChats(data);
        
        // Handle ?new=true param
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('new') === 'true') {
          // If a chat isn't already created/selected or we explicitly want a new one
          if (data.length === 0 || currentChatId) {
            createNewChat();
          }
          // Remove query param without reloading
          navigate('/dashboard/chat', { replace: true });
          // Focus input
          setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus();
          }, 100);
        } else if (data.length > 0 && !currentChatId) {
          setCurrentChatId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  const fetchMessages = async (chatId) => {
    if (!chatId || chatId === 'undefined' || chatId === 'null') {
      setMessages([]);
      return;
    }
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const createNewChat = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/api/chat`, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ title: 'New Conversation' })
      });
      const data = await res.json();
      if (res.ok) {
        setChats([data, ...chats]);
        setCurrentChatId(data._id);
        setMessages([]);
        setInput('');
      }
    } catch {
      setError('Failed to create new chat');
    }
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, { 
        method: 'DELETE', 
        headers 
      });
      if (res.ok) {
        const updatedChats = chats.filter(c => c._id !== chatId);
        setChats(updatedChats);
        if (currentChatId === chatId) {
          setCurrentChatId(updatedChats.length > 0 ? updatedChats[0]._id : null);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const togglePinChat = async (e, chatId, currentStatus) => {
    e.stopPropagation();
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, { 
        method: 'PUT', 
        headers,
        body: JSON.stringify({ isPinned: !currentStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setChats(prev => prev.map(c => c._id === chatId ? data : c));
      }
    } catch (err) {
      console.error('Failed to pin chat', err);
    }
  };

  const startEditChat = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat._id);
    setEditTitle(chat.title);
  };

  const saveEditChat = async (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, { 
        method: 'PUT', 
        headers,
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        const data = await res.json();
        setChats(prev => prev.map(c => c._id === chatId ? data : c));
      }
    } catch (err) {
      console.error('Failed to rename chat', err);
    } finally {
      setEditingChatId(null);
    }
  };

  const renderChatItem = (chat) => (
    <div 
      key={chat._id} 
      className={`${styles.chatListItem} ${currentChatId === chat._id ? styles.activeChat : ''}`}
      onClick={() => setCurrentChatId(chat._id)}
    >
      <div className={styles.chatListTitle}>
        <MessageSquare size={16} />
        {editingChatId === chat._id ? (
          <form onSubmit={(e) => saveEditChat(e, chat._id)} style={{width: '100%'}}>
            <input 
              type="text" 
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={styles.editChatInput}
              onBlur={(e) => saveEditChat(e, chat._id)}
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        ) : (
          <span title={chat.title}>{chat.title}</span>
        )}
      </div>
      
      {!editingChatId && (
        <div className={styles.chatActionsSidebar}>
          <button 
            className={styles.sidebarActionBtn}
            onClick={(e) => togglePinChat(e, chat._id, chat.isPinned)}
            title={chat.isPinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} style={{ fill: chat.isPinned ? 'currentColor' : 'none' }} />
          </button>
          <button 
            className={styles.sidebarActionBtn}
            onClick={(e) => startEditChat(e, chat)}
            title="Rename"
          >
            <Edit2 size={14} />
          </button>
          <button 
            className={styles.sidebarActionBtn}
            onClick={(e) => deleteChat(e, chat._id)}
            title="Delete Chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const clearChatMessages = async () => {
    if (!currentChatId || messages.length === 0) return;
    if (window.confirm('Are you sure you want to clear all messages in this conversation?')) {
      try {
        const headers = await getHeaders();
        // Since backend doesn't have an explicit clear route right now, we can just delete the whole chat and create a new one, or leave it as client side for now. Let's just create a new one to simulate clearing.
        await fetch(`${API_BASE_URL}/api/chat/${currentChatId}`, { method: 'DELETE', headers });
        setChats(chats.filter(c => c._id !== currentChatId));
        setCurrentChatId(null);
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear messages', err);
      }
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    let targetChatId = currentChatId;
    let tempId = null;

    setError('');
    setRateLimitError(null);
    setIsLoading(true);

    try {
      const headers = await getHeaders();

      // Pre-flight validation: If no chat exists, explicitly create one first.
      if (!targetChatId) {
        const createRes = await fetch(`${API_BASE_URL}/api/chat`, { 
          method: 'POST', 
          headers,
          body: JSON.stringify({ 
            title: text.substring(0, 30),
            systemInstruction: "You are Luma, an intelligent productivity companion inside FlowMind. You are professional, friendly, helpful, intelligent, confident, and clear. Never robotic, never overly casual."
          })
        });
        
        const createData = await createRes.json();
        
        if (!createRes.ok) {
          throw new Error(createData.error || 'Failed to initialize a new chat session');
        }
        
        targetChatId = createData._id;
        
        // Optimistically add the new chat to the sidebar
        setChats(prev => [createData, ...prev]);
        setCurrentChatId(targetChatId);
      }

      // Optimistic UI update for the message (only after we guarantee a chat exists)
      tempId = Date.now().toString();
      setMessages(prev => [...prev, { _id: tempId, senderRole: 'user', content: text }]);
      setInput('');

      // Send the actual message using the mathematically guaranteed valid targetChatId
      const response = await fetch(`${API_BASE_URL}/api/chat/${targetChatId}/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (!response.ok) {
        // If message fails, remove optimistic UI message and throw
        setMessages(prev => prev.filter(m => m._id !== tempId));
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        throw new Error(data.error || 'Failed to communicate with AI');
      }

      // Replace optimistic message with actual DB records
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m._id !== tempId);
        return [...withoutTemp, data.userMessage, data.aiMessage];
      });
      
      // Update chat title in sidebar if the backend renamed it
      setChats(prev => prev.map(c => c._id === targetChatId ? data.chat : c));
      
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        setRateLimitError(text);
      } else {
        setError(err.message);
      }
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setIsLoading(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleRegenerate = (index) => {
    let lastUserMsg = null;
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].senderRole === 'user') {
        lastUserMsg = messages[i].content;
        break;
      }
    }
    if (lastUserMsg) {
      setMessages(prev => prev.slice(0, index));
      sendMessage(lastUserMsg);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.container}>
      
      {/* Sidebar for History */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={createNewChat}>
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className={styles.chatSearchWrapperSidebar}>
          <Search size={14} className={styles.chatSearchIcon} />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className={styles.chatSearchInputSidebar}
          />
        </div>

        <div className={styles.chatList}>
          {(() => {
            const filtered = chats.filter(c => c.title.toLowerCase().includes(chatSearch.toLowerCase()));
            const pinned = filtered.filter(c => c.isPinned);
            const recent = filtered.filter(c => !c.isPinned);

            return (
              <>
                {pinned.length > 0 && (
                  <div className={styles.chatGroup}>
                    <div className={styles.chatGroupLabel}>Pinned</div>
                    {pinned.map(chat => renderChatItem(chat))}
                  </div>
                )}
                
                {recent.length > 0 && (
                  <div className={styles.chatGroup}>
                    <div className={styles.chatGroupLabel}>Recent</div>
                    {recent.map(chat => renderChatItem(chat))}
                  </div>
                )}

                {filtered.length === 0 && (
                  <div style={{padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                    {chats.length === 0 ? "No previous chats." : "No matching chats."}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainChat}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.lumaAvatarHeader}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <h2>Luma</h2>
              <span className={styles.headerSubtitle}>Powered by FlowMind AI</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.chatSearchWrapper}>
              <Search size={14} className={styles.chatSearchIcon} />
              <input 
                type="text" 
                placeholder="Search in chat..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.chatSearchInput}
              />
            </div>
            {messages.length > 0 && (
              <button className={styles.clearChatBtn} onClick={clearChatMessages} title="Clear Conversation">
                <RefreshCw size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {rateLimitError && <RateLimitErrorCard onRetry={() => sendMessage(rateLimitError)} />}

        <div className={styles.chatArea} ref={chatAreaRef}>
          {messages.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.lumaAvatarLarge}>
                <Sparkles size={40} color="#fff" />
              </div>
              <h3>👋 Hi, I'm Luma</h3>
              <span className={styles.emptySubtitle}>Your Intelligent Productivity Companion</span>
              <p>I can help you analyze documents, generate professional emails, build workflows, answer questions, and boost your productivity.</p>
              
              <div className={styles.suggestedPrompts}>
                <button className={styles.promptCard} onClick={() => setInput('Summarize this document')}>
                  "Summarize this document"
                </button>
                <button className={styles.promptCard} onClick={() => setInput('Create a workflow for my project')}>
                  "Create a workflow for my project"
                </button>
                <button className={styles.promptCard} onClick={() => setInput('Write a professional email')}>
                  "Write a professional email"
                </button>
                <button className={styles.promptCard} onClick={() => setInput('Explain this topic')}>
                  "Explain this topic"
                </button>
              </div>
            </div>
          )}

          {(searchTerm ? messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())) : messages).map((msg, index) => {
            const isUser = msg.senderRole === 'user';
            
            return (
              <div key={msg._id} className={`${styles.messageWrapper} ${isUser ? styles.userMessage : styles.modelMessage}`}>
                <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.modelAvatar}`}>
                  {isUser ? <User size={20} /> : <div className={styles.lumaAvatarSmall}><Sparkles size={12} color="#fff" /></div>}
                </div>
                
                <div className={styles.messageContent}>
                  <div className={styles.markdown}>
                    {isUser ? (
                      <p style={{margin: 0, whiteSpace: 'pre-wrap'}}>{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                              />
                            ) : (
                              <code {...props} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  
                  {!isUser && (
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => handleCopy(msg.content, msg._id)}
                        title="Copy response"
                      >
                        {copiedId === msg._id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => handleRegenerate(index)}
                        title="Regenerate response"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.modelMessage}`}>
              <div className={`${styles.avatar} ${styles.modelAvatar}`}>
                <div className={styles.lumaAvatarSmall}><Sparkles size={12} color="#fff" /></div>
              </div>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luma anything..."
              rows={1}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={styles.sendBtn}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
