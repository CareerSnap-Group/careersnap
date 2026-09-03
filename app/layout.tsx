import type { Metadata } from 'next';
import { colors, typography } from '@/lib/design-tokens';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'CareerSnap — Find Your Next Career Opportunity',
  description: 'Discover and apply to jobs that match your skills and career goals. Join thousands of professionals using CareerSnap for their job search.',
  keywords: 'jobs, careers, job search, recruitment, employment',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'CareerSnap — Find Your Next Career Opportunity',
    description: 'Discover and apply to jobs that match your skills and career goals.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%235a7cfd'>📸</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
