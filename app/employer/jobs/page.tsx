import Link from 'next/link';
import { getEmployerContext } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';
import jobStyles from './jobs.module.css';
import { JobActions } from './job-actions';

export default async function EmployerJobsPage() {
  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as unknown as { company_id: string } | null)?.company_id;
  const { data: jobs } = companyId ? await supabase.from('jobs').select('id, title, status, location, created_at').eq('company_id', companyId).order('created_at', { ascending: false }) : { data: [] };
  const jobIds = (jobs || []).map((job) => job.id);
  const { data: applicationRows } = jobIds.length ? await supabase.from('applications').select('job_id').in('job_id', jobIds) : { data: [] };
  const applicationCounts = (applicationRows || []).reduce<Record<string, number>>((counts, application) => ({ ...counts, [application.job_id]: (counts[application.job_id] || 0) + 1 }), {});
  return <><Header /><main className={styles.page}><div className={styles.container}><div className={jobStyles.toolbar}><header className={styles.header} style={{ marginBottom: 0 }}><h1 className={styles.title}>Manage Jobs</h1><p className={styles.subtitle}>Create, publish, and maintain listings for your authorized company.</p></header><Link href="/employers/post-job" className={jobStyles.primaryAction}>Post a Job</Link></div>{jobs?.length ? <div className={styles.applicationsCard}><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Title</th><th>Location</th><th>Status</th><th>Created</th><th>Applications</th><th>Actions</th></tr></thead><tbody>{jobs.map((job) => <tr className={styles.tableRow} key={job.id}><td className={styles.cellJob}>{job.title}</td><td className={styles.cell}>{job.location}</td><td className={styles.cell}><span className={`${jobStyles.statusBadge} ${jobStyles[job.status as 'draft' | 'published' | 'closed']}`}>{job.status}</span></td><td className={styles.cell}>{new Date(job.created_at).toLocaleDateString()}</td><td className={styles.cell}>{applicationCounts[job.id] || 0}</td><td className={styles.cell}><JobActions id={job.id} status={job.status} /></td></tr>)}</tbody></table></div></div> : <Card className={styles.emptyState}><div className={styles.emptyContent}><h2 className={styles.emptyTitle}>No jobs yet</h2><p className={styles.emptyDescription}>Create your first listing when you are ready to start hiring.</p><Link href="/employers/post-job" className={styles.emptyLink}><span className={styles.emptyButton}>Post a Job</span></Link></div></Card>}</div></main><Footer /></>;
}