import { getEmployerContext } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerApplicationsPage() {
  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as unknown as { company_id: string } | null)?.company_id;
  const { data: rawApplications } = companyId ? await supabase.from('applications').select('id, status, created_at, jobs!inner(title, company_id)').eq('jobs.company_id', companyId).order('created_at', { ascending: false }) : { data: [] };
  const applications = rawApplications as unknown as Array<{ id: string; status: string; created_at: string; jobs: { title: string } }>;
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Applications</h1><p className={styles.subtitle}>Review applications submitted to your company jobs.</p></header>{applications?.length ? <div className={styles.applicationsCard}><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Job</th><th>Status</th><th>Received</th></tr></thead><tbody>{applications.map((application) => <tr className={styles.tableRow} key={application.id}><td className={styles.cellJob}>{(application.jobs as unknown as { title: string }).title}</td><td className={styles.cell}>{application.status}</td><td className={styles.cell}>{new Date(application.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></div> : <Card className={styles.legendCard}><h2 className={styles.legendTitle}>No applications yet</h2><p>Applications for your published jobs will appear here.</p></Card>}</div></main><Footer /></>;
}