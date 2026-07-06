import styles from './States.module.css';
import { AlertCircle } from 'lucide-react';
import Button from '../Button/Button';

export const ErrorState = ({ 
  title = "Something went wrong", 
  description = "We encountered an error while loading this content.",
  onRetry 
}) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.iconWrapper} ${styles.errorIcon}`}>
        <AlertCircle size={48} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="outline" onClick={onRetry}>Try Again</Button>
        </div>
      )}
    </div>
  );
};
