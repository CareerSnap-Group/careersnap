import React from 'react';
import styles from './input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function Input({ label, error, helperText, fullWidth = true, className = '', ...props }: InputProps) {
  const generatedId = React.useId();
  const id = props.id || generatedId;

  return (
    <div className={fullWidth ? styles.fullWidth : ''}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input id={id} className={`${styles.input} ${error ? styles.error : ''} ${className}`} {...props} />
      {error && <p className={styles.errorText}>{error}</p>}
      {helperText && !error && <p className={styles.helperText}>{helperText}</p>}
    </div>
  );
}
