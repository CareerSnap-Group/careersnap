import { requireRole } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerBillingPage() {
  await requireRole('employer');
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Billing</h1><p className={styles.subtitle}>Billing tools will be available when employer packages launch.</p></header><Card className={styles.legendCard}><h2 className={styles.legendTitle}>Coming next</h2><p>There are no billing actions or payment details to manage in this phase.</p></Card></div></main><Footer /></>;
}