import Link from 'next/link';
import { requireRole } from '@/lib/auth/server';
import { getCurrentCompanyBillingContext } from '@/lib/billing/server';
import { AuthenticatedAppShell } from '@/components/layout/authenticated-app-shell';
import { Icon } from '@/components/icons';
import dashboardStyles from '@/components/layout/authenticated-dashboard.module.css';
import styles from './dashboard.module.css';

type CompanyPreview = { name: string; logo_url: string | null; industry: string | null; location: string | null; description: string | null; website_url: string | null };
type EmployerApplication = { id: string; applicant_id: string; status: string; created_at: string; jobs: { title: string } | { title: string }[] | null };

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default async function EmployerDashboard() {
  const { supabase, user, profile } = await requireRole('employer');
  const relationClient = supabase as any;
  const [{ data: rawMembership }, companyContext] = await Promise.all([
    relationClient.from('employer_users')
      .select('company_id, companies(name, logo_url, industry, location, description, website_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    getCurrentCompanyBillingContext(),
  ]);

  const membership = rawMembership as { company_id: string; companies: CompanyPreview[] | null } | null;
  const company = membership?.companies?.[0] || null;
  const companyId = membership?.company_id ?? null;
  const activeEntitlement = companyContext.activeEntitlement;
  const plan = companyContext.plan;
  const freeEntitlement = plan?.code === 'introductory-free' ? activeEntitlement : null;
  const freeRemaining = freeEntitlement ? Math.max(freeEntitlement.granted_quantity - freeEntitlement.consumed_quantity, 0) : 0;

  const [jobsResult, applicationsResult] = companyId ? await Promise.all([
    supabase.from('jobs').select('id, status').eq('company_id', companyId),
    relationClient.from('applications')
      .select('id, applicant_id, status, created_at, jobs!inner(title, company_id)')
      .eq('jobs.company_id', companyId)
      .order('created_at', { ascending: false }),
  ]) : [
    { data: [] as Array<{ id: string; status: string }>, error: null },
    { data: [] as EmployerApplication[], error: null },
  ];

  const companyJobs = jobsResult.data || [];
  const applicationRows = (applicationsResult.data || []) as EmployerApplication[];
  const jobIds = companyJobs.map((job) => job.id);
  const viewsResult = jobIds.length
    ? await supabase.from('job_views').select('*', { count: 'exact', head: true }).in('job_id', jobIds)
    : { count: 0, error: null };
  const jobs = companyJobs.filter((job) => job.status === 'published').length;
  const managedJobs = companyJobs.filter((job) => ['draft', 'published'].includes(job.status)).length;
  const applications = applicationRows.length;
  const interviews = applicationRows.filter((application) => application.status === 'interview').length;
  const candidates = new Set(applicationRows.map((application) => application.applicant_id)).size;
  const activeJobsLimit = activeEntitlement?.active_job_limit ?? null;
  const remainingJobs = activeJobsLimit === null ? null : Math.max(activeJobsLimit - managedJobs, 0);
  const remainingPostings = activeEntitlement ? Math.max(activeEntitlement.granted_quantity - activeEntitlement.consumed_quantity, 0) : 0;
  const companyName = company?.name || companyContext.companyName || 'Your company';
  const companyProfileFields = company ? [company.name, company.description, company.industry, company.location, company.website_url, company.logo_url] : [];
  const companyProfileCompletion = companyProfileFields.length ? Math.round(companyProfileFields.filter(Boolean).length / companyProfileFields.length * 100) : 0;
  const recentApplications = applicationRows.slice(0, 5);
  const recentApplicantIds = [...new Set(recentApplications.map((application) => application.applicant_id))];
  const candidateProfilesResult = recentApplicantIds.length
    ? await supabase.from('profiles').select('id, full_name, first_name, last_name').in('id', recentApplicantIds)
    : { data: [], error: null };
  const candidateNames = new Map((candidateProfilesResult.data || []).map((candidate) => [
    candidate.id,
    candidate.full_name || [candidate.first_name, candidate.last_name].filter(Boolean).join(' ') || 'Candidate',
  ]));
  const dashboardUnavailable = Boolean(jobsResult.error || applicationsResult.error || viewsResult.error);
  const applicantInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C';

  return (
    <AuthenticatedAppShell role="employer" displayName={companyName} greeting={`${greeting()}, ${companyName}`} avatarUrl={profile.profile_photo_url}>
      <main className={dashboardStyles.dashboard}>
        {dashboardUnavailable ? (
          <div className={dashboardStyles.emptyState} role="alert"><h2 className={dashboardStyles.emptyTitle}>Hiring data is temporarily unavailable</h2><p className={dashboardStyles.emptyText}>We could not load your company jobs and applications. Please try again later.</p></div>
        ) : (
          <>
            <section className={`${dashboardStyles.overviewRail} ${styles.overviewRail}`} aria-label="Hiring overview">
              <article className={`${dashboardStyles.overviewCard} ${dashboardStyles.overviewCardPrimary}`}>
                <div><h2 className={dashboardStyles.overviewTitle}>Hiring overview</h2><p className={dashboardStyles.overviewValue}>{jobs}</p><p className={dashboardStyles.overviewDetail}>Open positions</p></div>
                <div className={dashboardStyles.cardStats}><span>{applications} applications</span><span>{interviews} interviews</span><span>{viewsResult.count ?? 0} job views</span></div>
                <Link href="/employer/applications" className={dashboardStyles.overviewLink}>Manage hiring <Icon name="chevron-right" size={15} /></Link>
              </article>

              <article className={dashboardStyles.overviewCard}>
                <div><h2 className={dashboardStyles.overviewTitle}>Active jobs</h2><p className={dashboardStyles.overviewValue}>{jobs}</p><p className={dashboardStyles.overviewDetail}>{managedJobs} published or draft positions</p></div>
                <Link href="/employer/jobs" className={dashboardStyles.overviewLink}>View jobs <Icon name="chevron-right" size={15} /></Link>
              </article>

              <article className={dashboardStyles.overviewCard}>
                <div><h2 className={dashboardStyles.overviewTitle}>Applicant pool</h2><p className={dashboardStyles.overviewValue}>{candidates}</p><p className={dashboardStyles.overviewDetail}>Candidates who applied to your jobs</p></div>
                <Link href="/employer/cvs" className={dashboardStyles.overviewLink}>Find candidates <Icon name="chevron-right" size={15} /></Link>
              </article>

              <article className={dashboardStyles.overviewCard}>
                <div>
                  <h2 className={dashboardStyles.overviewTitle}>Company profile</h2>
                  {company ? <><p className={dashboardStyles.overviewValue}>{companyProfileCompletion}%</p><p className={dashboardStyles.overviewDetail}>Profile completion</p><div className={dashboardStyles.progressTrack} role="progressbar" aria-label="Company profile completion" aria-valuenow={companyProfileCompletion} aria-valuemin={0} aria-valuemax={100}><div className={dashboardStyles.progressFill} style={{ width: `${companyProfileCompletion}%` }} /></div></> : <p className={dashboardStyles.overviewMessage}>Create a company profile to introduce your team to candidates.</p>}
                </div>
                <Link href="/employer/company" className={dashboardStyles.overviewLink}>{company ? 'Manage profile' : 'Set up profile'} <Icon name="chevron-right" size={15} /></Link>
              </article>
            </section>

            <nav className={`${dashboardStyles.quickActions} ${styles.quickActions}`} aria-label="Quick actions">
              <Link href="/employers/post-job" className={dashboardStyles.quickAction}><span className={dashboardStyles.quickIcon}><Icon name="briefcase" size={22} /></span><span>Post Job</span></Link>
              <Link href="/employer/cvs" className={dashboardStyles.quickAction}><span className={dashboardStyles.quickIcon}><Icon name="search" size={22} /></span><span>Candidates</span></Link>
              <Link href="/employer/applications" className={dashboardStyles.quickAction}><span className={dashboardStyles.quickIcon}><Icon name="calendar" size={22} /></span><span>Applications</span></Link>
            </nav>

            <section className={`${dashboardStyles.planStrip} ${styles.planStrip}`} aria-label="Posting plan">
              <div className={dashboardStyles.planTop}><h2 className={dashboardStyles.planTitle}>{plan?.code === 'introductory-free' ? 'Free job postings' : 'Current package'}</h2><Link href="/employer/subscription" className={dashboardStyles.planLink}>View plan</Link></div>
              <p className={dashboardStyles.planDetail}>
                {plan?.code === 'introductory-free'
                  ? `${freeRemaining} of 4 introductory postings remain.`
                  : plan
                    ? `${plan.name} · ${plan.currency} ${Number(plan.price).toFixed(2)}. ${remainingPostings} postings remain.`
                    : 'No active package is currently available.'}
                {activeJobsLimit !== null ? ` ${remainingJobs} active job slots remain.` : ''}
              </p>
            </section>

            <section className={`${dashboardStyles.section} ${styles.recentActivity}`} aria-labelledby="recent-hiring-activity-title">
              <div className={dashboardStyles.sectionHeader}>
                <h2 id="recent-hiring-activity-title" className={dashboardStyles.sectionTitle}>Recent hiring activity</h2>
                <Link href="/employer/applications" className={dashboardStyles.sectionLink}>View all</Link>
              </div>
              {recentApplications.length ? (
                <div className={dashboardStyles.activityList}>
                  {recentApplications.map((application) => {
                    const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
                    const candidateName = candidateNames.get(application.applicant_id) || 'Candidate';
                    return (
                      <Link key={application.id} href={`/employer/applications/${application.id}`} className={dashboardStyles.activityRow}>
                        <span className={dashboardStyles.candidateAvatar}>{applicantInitials(candidateName)}</span>
                        <span className={dashboardStyles.activityMain}><span className={dashboardStyles.activityTitle}>{candidateName}</span><span className={dashboardStyles.activitySubtitle}>{job?.title || 'Job application'}</span></span>
                        <span className={dashboardStyles.activityMeta}><span className={`${dashboardStyles.status} ${application.status === 'shortlisted' || application.status === 'interview' ? dashboardStyles.statusAttention : ''}`}>{application.status}</span><time dateTime={application.created_at}>{shortDate(application.created_at)}</time></span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className={dashboardStyles.emptyState}><h3 className={dashboardStyles.emptyTitle}>No applications yet</h3><p className={dashboardStyles.emptyText}>Applications for your published jobs will appear here.</p><Link href="/employers/post-job" className={dashboardStyles.overviewLink}>Post a job <Icon name="chevron-right" size={15} /></Link></div>
              )}
            </section>
          </>
        )}
      </main>
    </AuthenticatedAppShell>
  );
}