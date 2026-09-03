import { colors, typography, spacing, borderRadius, shadows } from '@/lib/design-tokens';

export const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${typography.fontFamily.sans};
    font-size: ${typography.fontSize.base};
    font-weight: ${typography.fontWeight.regular};
    line-height: ${typography.lineHeight.normal};
    color: ${colors.text.primary};
    background-color: ${colors.background.primary};
  }

  a {
    color: ${colors.primary[600]};
    text-decoration: none;
    transition: color 150ms ease-in-out;
  }

  a:hover {
    color: ${colors.primary[700]};
  }

  a:focus {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }

  input, textarea, select {
    font-family: inherit;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${typography.fontWeight.semibold};
    line-height: ${typography.lineHeight.tight};
  }

  h1 {
    font-size: ${typography.fontSize['4xl']};
  }

  h2 {
    font-size: ${typography.fontSize['3xl']};
  }

  h3 {
    font-size: ${typography.fontSize['2xl']};
  }

  h4 {
    font-size: ${typography.fontSize.xl};
  }

  h5, h6 {
    font-size: ${typography.fontSize.lg};
  }

  /* Lists */
  ul, ol {
    margin-left: ${spacing.md};
  }

  /* Code blocks */
  pre, code {
    font-family: ${typography.fontFamily.mono};
    font-size: ${typography.fontSize.sm};
  }

  /* Focus visible for accessibility */
  :focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }
`;
