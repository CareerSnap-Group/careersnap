import { notFound } from 'next/navigation';
import { getEmployerContext } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { JobForm } from '@/app/employers/post-job/job-form';
import styles from '@/app/employers/post-job/post-job.module.css';

export default async function EditEmployerJobPage({ params }: { params: { id: string } }) {
  const { supabase } = await getEmployerContext();
  const { data: job } = await supabase.from('jobs').select('id, title, company_id, location, work_location, job_type, experience_level, salary_min, salary_max, salary_currency, description, responsibilities, requirements, benefits, status').eq('id', params.id).maybeSingle();
  if (!job) notFound();

  const { data: company } = await supabase.from('companies').select('name').eq('id', job.company_id).maybeSingle();
  return <div className={styles.page}><Header /><div className={styles.container}><div className={styles.header}><h1 className={styles.title}>Edit Job</h1><p className={styles.subtitle}>Update the details and publishing status for this listing.</p></div><JobForm mode="edit" jobId={job.id} initialStatus={job.status} initialData={{ jobTitle: job.title, company: company?.name || '', location: job.location, workLocation: job.work_location, jobType: job.job_type, experienceLevel: job.experience_level, salaryMin: job.salary_min === null ? '' : String(job.salary_min), salaryMax: job.salary_max === null ? '' : String(job.salary_max), currency: job.salary_currency || 'ZAR', description: job.description, responsibilities: job.responsibilities.join('\n'), requirements: job.requirements.join('\n'), benefits: job.benefits.join('\n') }} /></div><Footer /></div>;
}