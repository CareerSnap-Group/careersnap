import React from 'react';

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
        <label htmlFor={id} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
          {label}
        </label>
      )}
      <select
        id={id}
        style={{
          width: fullWidth ? '100%' : 'auto',
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          border: `1px solid ${error ? '#ef4444' : '#d4dce5'}`,
          borderRadius: '0.5rem',
          backgroundColor: '#ffffff',
          color: '#1a202c',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#ef4444' }}>{error}</p>}
      {helperText && !error && <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#8fa0b5' }}>{helperText}</p>}
    </div>
  );
}
