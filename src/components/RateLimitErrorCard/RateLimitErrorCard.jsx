import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './RateLimitErrorCard.module.css';

const RateLimitErrorCard = ({ onRetry }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <AlertTriangle size={24} />
        <h3>Luma has reached the current AI usage limit.</h3>
      </div>
      <p className={styles.subtitle}>
        This usually happens when the daily or per-minute Google AI Studio quota has been reached. Please wait a few moments and try again.
      </p>
      {onRetry && (
        <div className={styles.actions}>
          <button className={styles.retryBtn} onClick={onRetry}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default RateLimitErrorCard;
