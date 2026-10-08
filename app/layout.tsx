import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { AuthenticatedAppShellBoundary } from '@/components/layout/authenticated-app-shell-boundary';
import '@/app/globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

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
    <html lang="en" className={poppins.variable}>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/careersnap-pro-logo.png" />
      </head>
      <body className={poppins.className}>
        <AuthenticatedAppShellBoundary>{children}</AuthenticatedAppShellBoundary>
      </body>
    </html>
  );
}
