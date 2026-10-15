/**
 * CareerSnap Design Tokens
 * Central source of truth for all design values
 */

export const colors = {
  // Orange brand shades; darker shades keep text and controls accessible.
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F48120',
    600: '#C65300',
    700: '#9A3E00',
    800: '#6F2D00',
    900: '#512000',
  },
  button: {
    primary: '#C65300',
    primaryHover: '#A84200',
  },
  // Neutral - restrained grays
  neutral: {
    50: '#FFFFFF',
    100: '#FAFAFA',
    200: '#F5F5F5',
    300: '#E5E5E5',
    400: '#D4D4D4',
    500: '#A3A3A3',
    600: '#737373',
    700: '#525252',
    800: '#404041',
    900: '#262626',
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
    500: '#FAAD3F',
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
    primary: '#404041',
    secondary: '#737373',
    tertiary: '#737373',
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
  },
  footer: '#404041',
  header: '#404041',
  headerBorder: '#525252',
  headerText: '#FFFFFF',
  headerControlBorder: '#A3A3A3',
  accent: '#FAAD3F',
  border: '#E5E5E5',
  divider: '#E5E5E5',
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
  sm: '0 2px 8px rgb(64 64 65 / 5%)',
  md: '0 5px 16px rgb(64 64 65 / 7%)',
  lg: '0 10px 24px rgb(64 64 65 / 9%)',
  xl: '0 16px 36px rgb(64 64 65 / 11%)',
  '2xl': '0 16px 36px rgb(64 64 65 / 11%)',
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
