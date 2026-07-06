import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', textAlign: 'center', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
          <AlertTriangle size={64} style={{ color: 'var(--color-danger)', marginBottom: '20px' }} />
          <h2>Something went wrong.</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '24px' }}>
            We're sorry, but an unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <RefreshCw size={18} />
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '30px', textAlign: 'left', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', overflow: 'auto', maxWidth: '80vw' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-danger)' }}>Error Details (Dev Only)</summary>
              <br />
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
