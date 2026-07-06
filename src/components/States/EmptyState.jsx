import styles from './States.module.css';
import { FileQuestion } from 'lucide-react';
import Button from '../Button/Button';

export const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = "No Data Found", 
  description = "Get started by creating something new.",
  actionLabel,
  onAction
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon size={48} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && (
        <div className={styles.action}>
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};
