import React from 'react';
import styles from './input.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = true,
  options = [],
  className = '',
  children,
  ...props
}: SelectProps) {
  const id = props.id || `select-${Math.random()}`;

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`${styles.input} ${error ? styles.error : ''} ${fullWidth ? styles.fullWidth : styles.autoWidth} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className={styles.errorText}>{error}</p>}
      {helperText && !error && <p className={styles.helperText}>{helperText}</p>}
    </div>
  );
}
