import styles from './badge.module.css';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'secondary', children, className = '' }: BadgeProps) {
  const classes = [styles.badge, styles[`variant-${variant}`], className].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
