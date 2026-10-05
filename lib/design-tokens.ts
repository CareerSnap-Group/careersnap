/**
 * CareerSnap Design Tokens
 * Central source of truth for all design values
 */

export const colors = {
  // Primary - CareerSnap professional blue accent
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#2563EB',
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#172554',
  },
  button: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
  },
  // Neutral - Professional grays
  neutral: {
    50: '#f8f9fb',
    100: '#f1f3f5',
    200: '#e4e7eb',
    300: '#cbd1d8',
    400: '#a4acb8',
    500: '#7a8491',
    600: '#626c79',
    700: '#4b5561',
    800: '#343b45',
    900: '#1f252d',
  },
  // Accent - Green for positive actions
  success: {
    50: '#f0fdf4',
    100: '#ECFDF5',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10B981',
    600: '#16a34a',
    700: '#15803d',
    800: '#047857',
  },
  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  // Danger
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
  },
  // Semantic colors
  text: {
    primary: '#171b22',
    secondary: '#46505d',
    tertiary: '#687382',
    inverse: '#ffffff',
  },
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fb',
    tertiary: '#f1f3f5',
  },
  footer: '#171b22',
  header: '#171b22',
  border: '#e2e6eb',
  divider: '#e2e6eb',
};

export const typography = {
  fontFamily: {
    sans: '"Aptos", "Segoe UI Variable", "Segoe UI", sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.625rem', // 10px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
};
