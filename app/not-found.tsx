import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>404</h1>
          <h2 className={styles.heading}>Page Not Found</h2>
          <p className={styles.description}>Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or removed.</p>

          <div className={styles.actions}>
            <Link href="/">
              <Button size="lg">Go Home</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" size="lg">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
