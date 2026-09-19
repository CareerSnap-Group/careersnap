import Link from 'next/link';
import { getEmployerContext } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerApplicationsPage() {
  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as unknown as { company_id: string } | null)?.company_id;
  const { data: rawApplications } = companyId ? await supabase.from('applications').select('id, applicant_id, resume_id, status, created_at, jobs!inner(title, company_id)').eq('jobs.company_id', companyId).order('created_at', { ascending: false }) : { data: [] };
  const applications = rawApplications as unknown as Array<{ id: string; applicant_id: string; resume_id: string | null; status: string; created_at: string; jobs: { title: string } }>;
  const { data: candidates } = applications.length ? await supabase.from('profiles').select('id, full_name').in('id', applications.map((application) => application.applicant_id)) : { data: [] };
  const candidateNames = new Map((candidates || []).map((candidate) => [candidate.id, candidate.full_name || 'Candidate']));
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Applications</h1><p className={styles.subtitle}>Review applications submitted to your company jobs.</p></header>{applications?.length ? <div className={styles.applicationsCard}><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Candidate</th><th>Job</th><th>Status</th><th>CV</th><th>Received</th><th>Review</th></tr></thead><tbody>{applications.map((application) => <tr className={styles.tableRow} key={application.id}><td className={styles.cellJob}>{candidateNames.get(application.applicant_id) || 'Candidate'}</td><td className={styles.cell}>{application.jobs.title}</td><td className={styles.cell}>{application.status}</td><td className={styles.cell}>{application.resume_id ? 'Available' : 'Not attached'}</td><td className={styles.cell}>{new Date(application.created_at).toLocaleDateString()}</td><td className={styles.cell}><Link href={`/employer/applications/${application.id}`} className={styles.actionLink}>Review</Link></td></tr>)}</tbody></table></div></div> : <Card className={styles.legendCard}><h2 className={styles.legendTitle}>No applications yet</h2><p>Applications for your published jobs will appear here.</p></Card>}</div></main><Footer /></>;
}