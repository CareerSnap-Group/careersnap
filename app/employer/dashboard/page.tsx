import Link from 'next/link';
import { requireRole } from '@/lib/auth/server';
import { getCurrentCompanyBillingContext } from '@/lib/billing/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerDashboard() {
  const { supabase, user } = await requireRole('employer');
  const { data: rawMembership } = await supabase.from('employer_users').select('company_id, companies(name)').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
  const membership = rawMembership as unknown as { company_id: string; companies: { name: string }[] | null } | null;
  const companyId = membership?.company_id ?? null;

  const companyContext = await getCurrentCompanyBillingContext();
  const activeEntitlement = companyContext.activeEntitlement;
  const plan = companyContext.plan;
  const freeEntitlement = plan?.code === 'introductory-free' ? activeEntitlement : null;
  const freeRemaining = freeEntitlement ? Math.max(freeEntitlement.granted_quantity - freeEntitlement.consumed_quantity, 0) : 0;

  const [{ data: companyJobs }, { data: applicationRows }] = companyId ? await Promise.all([
    supabase.from('jobs').select('id, status').eq('company_id', companyId),
    supabase.from('applications').select('applicant_id, jobs!inner(company_id)').eq('jobs.company_id', companyId),
  ]) : [{ data: [] as Array<{ id: string; status: string }> }, { data: [] as Array<{ applicant_id: string }> }];

  const jobIds = (companyJobs || []).map((job) => job.id);
  const { count: views } = jobIds.length ? await supabase.from('job_views').select('*', { count: 'exact', head: true }).in('job_id', jobIds) : { count: 0 };
  const jobs = (companyJobs || []).filter((job) => job.status === 'published').length;
  const managedJobs = (companyJobs || []).filter((job) => ['draft', 'published'].includes(job.status)).length;
  const applications = applicationRows?.length || 0;
  const candidates = new Set((applicationRows || []).map((application) => application.applicant_id)).size;

  const activeJobsLimit = activeEntitlement?.active_job_limit ?? null;
  const remainingJobs = activeJobsLimit === null ? null : Math.max(activeJobsLimit - managedJobs, 0);
  const remainingPostings = activeEntitlement ? Math.max(activeEntitlement.granted_quantity - activeEntitlement.consumed_quantity, 0) : 0;
  const companyName = membership?.companies?.[0]?.name || companyContext.companyName || 'Set up your company to start hiring.';

  return <><Header /><main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><h1 className={styles.title}>Employer Dashboard</h1><p className={styles.subtitle}>{companyName}</p></header>

    <div className={styles.statsGrid}>
      <Card className={styles.statCard}><p className={styles.statLabel}>Active Jobs</p><p className={styles.statValue}>{jobs ?? 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Applications</p><p className={styles.statValue}>{applications ?? 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Candidates</p><p className={styles.statValue}>{candidates}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Job Views</p><p className={styles.statValue}>{views ?? 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Free Job Postings</p><p className={styles.statValue}>{freeRemaining} of {plan?.code === 'introductory-free' ? 4 : 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Current Package</p><p className={styles.statValue}>{plan?.name || 'No package active'}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Jobs Remaining</p><p className={styles.statValue}>{activeJobsLimit === null ? 'No cap' : remainingJobs}</p></Card>
    </div>

    <div className={styles.legendCard}>
      <h2 className={styles.legendTitle}>Recruitment overview</h2>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <p>Company</p>
          <p>{companyName}</p>
        </div>
        <div className={styles.legendItem}>
          <p>Package</p>
          <p>{plan ? `${plan.name} · ${plan.currency} ${Number(plan.price).toFixed(2)}` : 'No package active'}</p>
        </div>
        <div className={styles.legendItem}>
          <p>Posting capacity</p>
          <p>{activeJobsLimit === null ? 'No active jobs limit configured' : `${remainingJobs} of ${activeJobsLimit} active jobs available`}</p>
        </div>
      </div>
    </div>

    <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
      <h2 className={styles.legendTitle}>Quick actions</h2>
      <p><Link href="/employers/post-job" className={styles.actionLink}>Post a job</Link>{' | '}<Link href="/employer/jobs" className={styles.actionLink}>Manage jobs</Link>{' | '}<Link href="/employer/subscription" className={styles.actionLink}>View subscription</Link></p>
    </div>

    {activeEntitlement && <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
      <h2 className={styles.legendTitle}>{plan?.code === 'introductory-free' ? 'Introductory allowance' : 'Active package allowance'}</h2>
      <p>{freeRemaining > 0 ? `${freeRemaining} job postings remain for the current package.` : 'Your current package has no remaining postings.'}</p>
    </div>}

    {!activeEntitlement && membership && <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
      <h2 className={styles.legendTitle}>Package status</h2>
      <p>No package active.</p>
    </div>}

    {jobs && jobs > 0 ? (
      <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
        <h2 className={styles.legendTitle}>Jobs snapshot</h2>
        <p>You currently have {jobs} active or draft jobs on your account.</p>
        <p>{activeEntitlement && remainingPostings > 0 ? `${remainingPostings} new job slots remain in your current package.` : 'You have reached the posting limit for your current package.'}</p>
      </div>
    ) : (
      <div className={styles.emptyState} style={{ marginTop: '1.5rem' }}>
        <div className={styles.emptyContent}>
          <h3 className={styles.emptyTitle}>No jobs yet</h3>
          <p className={styles.emptyDescription}>Your recruitment pipeline is ready. Add the first listing to start hiring.</p>
          <Link href="/employers/post-job" className={styles.emptyLink}><span className={styles.emptyButton}>Post your first job</span></Link>
        </div>
      </div>
    )}

    {applications && applications > 0 ? (
      <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
        <h2 className={styles.legendTitle}>Applicant activity</h2>
        <p>{applications} applications have been received across your company listings.</p>
        <p><Link href="/employer/applications" className={styles.actionLink}>Review applications</Link></p>
      </div>
    ) : (
      <div className={styles.emptyState} style={{ marginTop: '1.5rem' }}>
        <div className={styles.emptyContent}>
          <h3 className={styles.emptyTitle}>No applications yet</h3>
          <p className={styles.emptyDescription}>When candidates apply, their details will appear here for review.</p>
          <Link href="/employer/jobs" className={styles.emptyLink}><span className={styles.emptyButton}>View jobs</span></Link>
        </div>
      </div>
    )}
  </div></main><Footer /></>;
}