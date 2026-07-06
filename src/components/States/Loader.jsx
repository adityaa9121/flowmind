import styles from './States.module.css';

export const Loader = ({ fullScreen = false }) => {
  return (
    <div className={`${styles.container} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinner}></div>
    </div>
  );
};
