import Link from 'next/link';
import { requireRole } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerDashboard() {
  const { supabase, user } = await requireRole('employer');
  const { data: rawMembership } = await supabase.from('employer_users').select('company_id, companies(name)').eq('user_id', user.id).limit(1).maybeSingle();
  const membership = rawMembership as unknown as { company_id: string; companies: { name: string }[] | null } | null;
  const [{ count: jobs }, { count: applications }] = await Promise.all([
    membership ? supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', membership.company_id).in('status', ['draft', 'published']) : Promise.resolve({ count: 0 }),
    membership ? supabase.from('applications').select('*, jobs!inner(company_id)', { count: 'exact', head: true }).eq('jobs.company_id', membership.company_id) : Promise.resolve({ count: 0 }),
  ]);
  return <><Header /><main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><h1 className={styles.title}>Employer Dashboard</h1><p className={styles.subtitle}>{membership?.companies?.[0]?.name || 'Set up your company to start hiring.'}</p></header>
    <div className={styles.statsGrid}><Card className={styles.statCard}><p className={styles.statLabel}>Active Jobs</p><p className={styles.statValue}>{jobs ?? 0}</p></Card><Card className={styles.statCard}><p className={styles.statLabel}>Applications Received</p><p className={styles.statValue}>{applications ?? 0}</p></Card></div>
    <div className={styles.legendCard}><h2 className={styles.legendTitle}>Recruitment workspace</h2><p>Manage your listings, review candidates, and keep your company profile current.</p><p><Link href="/employers/post-job" className={styles.actionLink}>Post a job</Link>{' | '}<Link href="/employer/subscription" className={styles.actionLink}>View subscription</Link></p></div>
  </div></main><Footer /></>;
}