import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'CareerSnap — Find Your Next Career Opportunity',
  description: 'Discover and apply to jobs that match your skills and career goals. Join thousands of professionals using CareerSnap for their job search.',
  keywords: 'jobs, careers, job search, recruitment, employment',
  openGraph: {
    title: 'CareerSnap — Find Your Next Career Opportunity',
    description: 'Discover and apply to jobs that match your skills and career goals.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/careersnap-logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
