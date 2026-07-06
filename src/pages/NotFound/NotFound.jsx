import { ArrowLeft, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/Button/Button';

const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      position: 'relative',
      overflow: 'hidden',
      color: 'var(--text-main)'
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 1,
          padding: '2rem'
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}
        >
          <Map size={80} color="var(--color-primary)" style={{ opacity: 0.8, filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' }} />
        </motion.div>

        <h1 style={{
          fontSize: '6rem',
          fontWeight: '800',
          lineHeight: '1',
          margin: '0',
          background: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          404
        </h1>
        
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '600',
          marginTop: '1rem',
          marginBottom: '1.5rem',
          color: 'var(--text-main)'
        }}>
          Looks like you wandered off the path
        </h2>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          maxWidth: '450px',
          marginBottom: '2.5rem',
          lineHeight: '1.6'
        }}>
          It looks like the page you're searching for doesn't exist, has been moved, or is currently unavailable.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/dashboard'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem'
            }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating Particles for Premium Effect */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              y: Math.random() * 100 + '%', 
              x: Math.random() * 100 + '%', 
              opacity: 0.2 + Math.random() * 0.3,
              scale: 0.5 + Math.random() * 0.5
            }}
            animate={{ 
              y: [null, Math.random() * 100 + '%', Math.random() * 100 + '%'],
              x: [null, Math.random() * 100 + '%', Math.random() * 100 + '%'],
            }}
            transition={{ 
              duration: 20 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotFound;
