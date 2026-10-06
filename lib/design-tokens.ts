/**
 * CareerSnap Design Tokens
 * Central source of truth for all design values
 */

export const colors = {
  // Primary - CareerSnap professional blue accent
  primary: {
    50: '#EDF5FF',
    100: '#D9EBFF',
    200: '#B9D9FF',
    300: '#8FC2FF',
    400: '#5EA4FF',
    500: '#2A85FF',
    600: '#2177E8',
    700: '#1A67CC',
    800: '#124FA5',
    900: '#0B3977',
  },
  button: {
    primary: '#2A85FF',
    primaryHover: '#2177E8',
  },
  // Neutral - Professional grays
  neutral: {
    50: '#ffffff',
    100: '#f6f8fb',
    200: '#eef1f5',
    300: '#dce2e9',
    400: '#bbc4cf',
    500: '#A1A1A1',
    600: '#7A7A7A',
    700: '#666666',
    800: '#34383d',
    900: '#171717',
  },
  // Accent - Green for positive actions
  success: {
    50: '#e9f9f0',
    100: '#d9f4e4',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#25B96F',
    600: '#16a34a',
    700: '#1a8b50',
    800: '#147943',
  },
  // Warning
  warning: {
    50: '#fff5e8',
    100: '#ffebcf',
    200: '#f8d393',
    300: '#f6bd66',
    400: '#f4af4d',
    500: '#f3a33b',
    600: '#c37a19',
    700: '#a76610',
    800: '#995d0b',
  },
  // Danger
  danger: {
    50: '#fff0ef',
    100: '#ffe0dd',
    200: '#ffc4bf',
    300: '#f49c98',
    400: '#ed6f71',
    500: '#e5484d',
    600: '#d9363e',
    700: '#b42318',
    800: '#8f1d22',
  },
  // Semantic colors
  text: {
    primary: '#070707',
    secondary: '#A1A1A1',
    tertiary: '#8a8a8a',
    inverse: '#ffffff',
  },
  background: {
    primary: '#ffffff',
    secondary: '#F0F5FA',
    tertiary: '#f5f8fc',
  },
  footer: '#070707',
  header: '#070707',
  headerBorder: '#1C1C1C',
  headerText: '#f4f6f8',
  headerControlBorder: '#7A7A7A',
  accentPurple: { 50: '#f5f1ff', 700: '#6c45bd' },
  accentOrange: { 50: '#fff5e8', 700: '#995d0b' },
  border: '#e5e9ef',
  divider: '#e5e9ef',
};

export const typography = {
  fontFamily: {
    sans: '"Poppins", "Segoe UI", sans-serif',
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
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.25rem', // 20px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 2px 8px rgb(28 51 80 / 5%)',
  md: '0 5px 16px rgb(28 51 80 / 7%)',
  lg: '0 10px 24px rgb(28 51 80 / 9%)',
  xl: '0 16px 36px rgb(28 51 80 / 11%)',
  '2xl': '0 16px 36px rgb(28 51 80 / 11%)',
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
