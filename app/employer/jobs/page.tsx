import Link from 'next/link';
import { getEmployerContext } from '@/lib/auth/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerJobsPage() {
  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as unknown as { company_id: string } | null)?.company_id;
  const { data: jobs } = companyId ? await supabase.from('jobs').select('id, title, status, location, created_at').eq('company_id', companyId).order('created_at', { ascending: false }) : { data: [] };
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>My Jobs</h1><p className={styles.subtitle}>Create and manage jobs for your authorized company.</p></header>{jobs?.length ? <div className={styles.applicationsCard}><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Title</th><th>Location</th><th>Status</th><th>Created</th></tr></thead><tbody>{jobs.map((job) => <tr className={styles.tableRow} key={job.id}><td className={styles.cellJob}>{job.title}</td><td className={styles.cell}>{job.location}</td><td className={styles.cell}>{job.status}</td><td className={styles.cell}>{new Date(job.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></div> : <Card className={styles.legendCard}><h2 className={styles.legendTitle}>No jobs yet</h2><p>Create your first listing when you are ready to start hiring.</p><Link href="/employers/post-job" className={styles.actionLink}>Post a job</Link></Card>}</div></main><Footer /></>;
}