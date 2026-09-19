import Link from 'next/link';
import { requireRole } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

type SubscriptionPlan = {
  name: string;
  price: number;
  currency: string;
  billing_interval: string;
};

type SubscriptionRow = {
  status: string;
  plan_id: string;
  current_period_end: string | null;
  subscription_plans: SubscriptionPlan[] | null;
};

type PlanLimit = {
  feature: string;
  limit_value: number | null;
};

export default async function EmployerDashboard() {
  const { supabase, user } = await requireRole('employer');
  const { data: rawMembership } = await supabase.from('employer_users').select('company_id, companies(name)').eq('user_id', user.id).limit(1).maybeSingle();
  const membership = rawMembership as unknown as { company_id: string; companies: { name: string }[] | null } | null;
  const { data: rawSubscription } = await supabase.from('subscriptions').select('status, plan_id, current_period_end, subscription_plans(name, price, currency, billing_interval)').eq('user_id', user.id).in('status', ['trialing', 'active', 'past_due']).maybeSingle();
  const subscription = rawSubscription as SubscriptionRow | null;
  const plan = subscription?.subscription_plans?.[0];
  const [{ data: companyJobs }, { data: applicationRows }, { data: planLimitsRaw }] = await Promise.all([
    membership ? supabase.from('jobs').select('id, status').eq('company_id', membership.company_id) : Promise.resolve({ data: [] as Array<{ id: string; status: string }> }),
    membership ? supabase.from('applications').select('applicant_id, jobs!inner(company_id)').eq('jobs.company_id', membership.company_id) : Promise.resolve({ data: [] as Array<{ applicant_id: string }> }),
    subscription?.plan_id ? supabase.from('plan_entitlements').select('feature, limit_value').eq('plan_id', subscription.plan_id) : Promise.resolve({ data: [] as PlanLimit[] }),
  ]);
  const jobIds = (companyJobs || []).map((job) => job.id);
  const { count: views } = jobIds.length ? await supabase.from('job_views').select('*', { count: 'exact', head: true }).in('job_id', jobIds) : { count: 0 };
  const jobs = (companyJobs || []).filter((job) => job.status === 'published').length;
  const managedJobs = (companyJobs || []).filter((job) => ['draft', 'published'].includes(job.status)).length;
  const applications = applicationRows?.length || 0;
  const candidates = new Set((applicationRows || []).map((application) => application.applicant_id)).size;
  const planLimits = (planLimitsRaw as PlanLimit[] | null) ?? [];
  const activeJobsLimit = Number(planLimits.find((entry) => entry.feature === 'active_jobs_limit')?.limit_value ?? 0);
  const jobPostingLimit = Number(planLimits.find((entry) => entry.feature === 'job_posting_limit')?.limit_value ?? 0);
  const remainingJobs = Math.max(activeJobsLimit - managedJobs, 0);
  const remainingPostings = Math.max(jobPostingLimit - managedJobs, 0);

  return <><Header /><main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><h1 className={styles.title}>Employer Dashboard</h1><p className={styles.subtitle}>{membership?.companies?.[0]?.name || 'Set up your company to start hiring.'}</p></header>

    <div className={styles.statsGrid}>
      <Card className={styles.statCard}><p className={styles.statLabel}>Active Jobs</p><p className={styles.statValue}>{jobs ?? 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Applications</p><p className={styles.statValue}>{applications ?? 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Candidates</p><p className={styles.statValue}>{candidates}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Job Views</p><p className={styles.statValue}>{views ?? 0}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Current Package</p><p className={styles.statValue}>{plan?.name || 'Free'}</p></Card>
      <Card className={styles.statCard}><p className={styles.statLabel}>Jobs Remaining</p><p className={styles.statValue}>{remainingJobs}</p></Card>
    </div>

    <div className={styles.legendCard}>
      <h2 className={styles.legendTitle}>Recruitment overview</h2>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <p>Company</p>
          <p>{membership?.companies?.[0]?.name || 'Company profile not set yet.'}</p>
        </div>
        <div className={styles.legendItem}>
          <p>Package</p>
          <p>{plan ? `${plan.name} · ${plan.currency} ${Number(plan.price).toFixed(2)}` : 'Free package active'}</p>
        </div>
        <div className={styles.legendItem}>
          <p>Posting capacity</p>
          <p>{activeJobsLimit > 0 ? `${remainingJobs} of ${activeJobsLimit} active jobs available` : 'No active jobs limit configured'}</p>
        </div>
      </div>
    </div>

    <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
      <h2 className={styles.legendTitle}>Quick actions</h2>
      <p><Link href="/employers/post-job" className={styles.actionLink}>Post a job</Link>{' | '}<Link href="/employer/jobs" className={styles.actionLink}>Manage jobs</Link>{' | '}<Link href="/employer/subscription" className={styles.actionLink}>View subscription</Link></p>
    </div>

    {jobs && jobs > 0 ? (
      <div className={styles.legendCard} style={{ marginTop: '1.5rem' }}>
        <h2 className={styles.legendTitle}>Jobs snapshot</h2>
        <p>You currently have {jobs} active or draft jobs on your account.</p>
        <p>{remainingPostings > 0 ? `${remainingPostings} new job slots remain in your current package.` : 'You have reached the posting limit for your current package.'}</p>
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