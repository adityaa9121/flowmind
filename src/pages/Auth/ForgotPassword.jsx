import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions.');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <Card className={styles.authCard}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>
            <Sparkles className={styles.logoIcon} />
            <span>FlowMind AI</span>
          </Link>
          <h2>Password Reset</h2>
          <p>Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {message && <div className={styles.successAlert}>{message}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <Input 
              type="email" 
              label="Email Address" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" variant="primary" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Sending...' : 'Reset Password'}
          </Button>
        </form>

        <div className={styles.footer}>
          Remember your password? <Link to="/login" className={styles.link}>Sign in</Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
