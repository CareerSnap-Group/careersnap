import { Icon } from '@/components/icons';
import styles from './rating-summary.module.css';

export function RatingSummary({ average, count }: { average: number; count: number }) {
  const filled = Math.round(average);
  return (
    <div className={styles.summary} aria-label={count ? `${average.toFixed(1)} out of 5 from ${count} ratings` : 'No ratings yet'}>
      <span className={styles.stars} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <Icon key={index} name="star" size={16} className={index < filled ? styles.filled : ''} />)}
      </span>
      <span className={styles.value}>{count ? average.toFixed(1) : 'No ratings'}</span>
      {count > 0 && <span className={styles.count}>({count})</span>}
    </div>
  );
}
