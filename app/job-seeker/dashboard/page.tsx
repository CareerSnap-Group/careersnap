import Link from 'next/link';
import { requireRole } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function JobSeekerDashboard() {
  const { supabase, user } = await requireRole('job_seeker');
  const [savedJobsResult, applicationsResult] = await Promise.all([
    supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);
  const countError = savedJobsResult.error || applicationsResult.error;
  return <><Header /><main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><h1 className={styles.title}>Your Career Dashboard</h1><p className={styles.subtitle}>Keep your search moving with a clear view of your opportunities.</p></header>
    {countError ? <div className={styles.legendCard}><h2 className={styles.legendTitle}>Dashboard data unavailable</h2><p>We could not load your saved jobs and application counts. Please try again later.</p></div> : <div className={styles.statsGrid}><Card className={styles.statCard}><p className={styles.statLabel}>Saved Jobs</p><p className={styles.statValue}>{savedJobsResult.count ?? 0}</p></Card><Card className={styles.statCard}><p className={styles.statLabel}>Applications</p><p className={styles.statValue}>{applicationsResult.count ?? 0}</p></Card></div>}
    <div className={styles.legendCard}><h2 className={styles.legendTitle}>Next steps</h2><p>Explore new opportunities, keep applications up to date, and complete your professional profile.</p><p><Link href="/jobs" className={styles.actionLink}>Find jobs</Link>{' | '}<Link href="/profile" className={styles.actionLink}>Update profile</Link></p></div>
  </div></main><Footer /></>;
}