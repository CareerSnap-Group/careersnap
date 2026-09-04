import { requireRole } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerPackagesPage() {
  await requireRole('employer');
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Packages</h1><p className={styles.subtitle}>Employer packages will be available in a future CareerSnap release.</p></header><Card className={styles.legendCard}><h2 className={styles.legendTitle}>Coming next</h2><p>We are preparing flexible tools for growing recruitment teams. No package or payment changes are available yet.</p></Card></div></main><Footer /></>;
}