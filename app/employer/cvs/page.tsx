import { requireRole } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerCvsPage() {
  await requireRole('employer');
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Find CVs</h1><p className={styles.subtitle}>Candidate search will be available when the employer talent tools launch.</p></header><Card className={styles.legendCard}><h2 className={styles.legendTitle}>Candidate search</h2><p>Employer CV search is reserved for authorized employer accounts.</p></Card></div></main></>;
}