import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Brain, Zap, FileText, Mail, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

const floatingFeatures = [
  { icon: <Brain size={20} />, label: 'Luma AI', delay: 0 },
  { icon: <Zap size={20} />, label: 'Workflow Automation', delay: 1.5 },
  { icon: <FileText size={20} />, label: 'Document Analysis', delay: 3 },
  { icon: <Mail size={20} />, label: 'Email Generator', delay: 4.5 },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse parallax on left panel
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      setMousePos({ x, y });
    };
    const el = panelRef.current;
    if (el) el.addEventListener('mousemove', handleMouseMove);
    return () => { if (el) el.removeEventListener('mousemove', handleMouseMove); };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitLayout}>
      {/* ====== LEFT PANEL ====== */}
      <div className={styles.leftPanel} ref={panelRef}>
        <div className={styles.leftGlow} />
        <div className={styles.leftContent}>
          <div className={styles.leftLogo}>
            <div className={styles.logoSquare}><Sparkles size={18} /></div>
            <span>FlowMind AI</span>
          </div>
          
          <motion.h2 
            className={styles.leftHeadline}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your AI Workspace for <br />
            <span className={styles.leftGradient}>Smarter Productivity</span>
          </motion.h2>
          
          <motion.p 
            className={styles.leftDesc}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Automate tasks, analyze documents, and generate content — all powered by Gemini AI.
          </motion.p>

          {/* Floating Feature Cards */}
          <div className={styles.floatingCards}>
            {floatingFeatures.map((feature, i) => (
              <motion.div
                key={i}
                className={styles.floatCard}
                style={{
                  transform: `translate(${mousePos.x * (0.5 + i * 0.15)}px, ${mousePos.y * (0.5 + i * 0.15)}px)`
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              >
                <div className={styles.floatCardIcon}>{feature.icon}</div>
                <span>{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Particles */}
        <div className={styles.particles}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.particle} style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              width: `${4 + Math.random() * 4}px`,
              height: `${4 + Math.random() * 4}px`,
            }} />
          ))}
        </div>
      </div>

      {/* ====== RIGHT PANEL ====== */}
      <div className={styles.rightPanel}>
        <Link to="/" className={styles.backButton}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>

        <motion.div 
          className={styles.authCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.cardHeader}>
            <h2>Welcome back</h2>
            <p>Enter your credentials to access your account.</p>
          </div>

          {error && (
            <motion.div 
              className={styles.errorAlert}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="login-email">Email Address</label>
              <input 
                id="login-email"
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="login-password">Password</label>
              <div className={styles.passwordWrapper}>
                <input 
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className={styles.formMeta}>
              <label className={styles.rememberMe}>
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or continue with</span>
          </div>

          <button 
            type="button" 
            className={styles.googleBtn} 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className={styles.cardFooter}>
            Don't have an account? <Link to="/signup" className={styles.footerLink}>Create one</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
