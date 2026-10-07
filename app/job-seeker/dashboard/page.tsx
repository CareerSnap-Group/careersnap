import Link from 'next/link';
import { requireRole } from '@/lib/auth/server';
import { getJobSeekerProfileData } from '@/lib/profile-data';
import { AuthenticatedAppShell } from '@/components/layout/authenticated-app-shell';
import { Icon } from '@/components/icons';
import dashboardStyles from '@/components/layout/authenticated-dashboard.module.css';
import styles from './dashboard.module.css';

type CompanyPreview = { name: string; logo_url: string | null } | { name: string; logo_url: string | null }[] | null;
type JobPreview = { id: string; title: string; location: string; employment_type: string | null; workplace_type: string | null; companies: CompanyPreview };
type ApplicationPreview = { id: string; status: string; created_at: string; jobs: { id: string; title: string; companies: CompanyPreview } | { id: string; title: string; companies: CompanyPreview }[] | null };

function firstCompany(value: CompanyPreview) {
  return Array.isArray(value) ? value[0] : value;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default async function JobSeekerDashboard() {
  const { supabase, user } = await requireRole('job_seeker');
  const profileDataPromise = getJobSeekerProfileData(user.id);
  const jobsClient = supabase as any;
  const [profileData, applicationStatsResult, savedJobsResult, recentApplicationsResult, publishedJobsResult] = await Promise.all([
    profileDataPromise,
    supabase.from('applications').select('status', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('saved_jobs').select('job_id', { count: 'exact', head: true }).eq('user_id', user.id),
    jobsClient.from('applications')
      .select('id, status, created_at, jobs!inner(id, title, companies(name, logo_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    jobsClient.from('jobs')
      .select('id, title, location, employment_type, workplace_type, companies(name, logo_url)')
      .eq('status', 'published')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const profile = profileData.profile;
  const displayName = profile.first_name || profile.full_name?.split(/\s+/)[0] || user.email?.split('@')[0] || 'there';
  const applications = applicationStatsResult.data || [];
  const recentApplications = (recentApplicationsResult.data || []) as ApplicationPreview[];
  const publishedJobs = (publishedJobsResult.data || []) as JobPreview[];
  const applicationCount = applicationStatsResult.count ?? applications.length;
  const interviews = applications.filter((application) => application.status === 'interview').length;
  const offers = applications.filter((application) => ['offer', 'accepted', 'hired'].includes(application.status)).length;

  return (
    <AuthenticatedAppShell role="job_seeker" userId={user.id} displayName={profile.full_name || displayName} avatarUrl={profile.profile_photo_url}>
      <main className={dashboardStyles.dashboard}>
        <header className={dashboardStyles.welcome}>
          <div>
            <p className={dashboardStyles.eyebrow}>Job Seeker</p>
            <h1 className={dashboardStyles.greeting}>{greeting()}, {displayName}</h1>
            <p className={dashboardStyles.welcomeText}>Find opportunities, build your career, and keep your search moving.</p>
          </div>
          <span className={dashboardStyles.welcomeAvatar} aria-hidden="true">
            {profile.profile_photo_url ? <span className={styles.avatarImage} style={{ backgroundImage: `url(${profile.profile_photo_url})` }} /> : displayName.slice(0, 1).toUpperCase()}
          </span>
        </header>

        <section className={dashboardStyles.overviewRail} aria-label="Career overview">
          <article className={`${dashboardStyles.overviewCard} ${dashboardStyles.overviewCardPrimary}`}>
            <div>
              <h2 className={dashboardStyles.overviewTitle}>Profile</h2>
              <p className={dashboardStyles.overviewValue}>{profileData.completion}%</p>
              <p className={dashboardStyles.overviewDetail}>Profile completion</p>
              <div className={dashboardStyles.progressTrack} role="progressbar" aria-label="Profile completion" aria-valuenow={profileData.completion} aria-valuemin={0} aria-valuemax={100}>
                <div className={dashboardStyles.progressFill} style={{ width: `${profileData.completion}%` }} />
              </div>
            </div>
            <Link href="/settings" className={dashboardStyles.overviewLink}>Complete profile <Icon name="chevron-right" size={15} /></Link>
          </article>

          <article className={dashboardStyles.overviewCard}>
            <div>
              <h2 className={dashboardStyles.overviewTitle}>Applications</h2>
              <p className={dashboardStyles.overviewValue}>{applicationCount}</p>
              <div className={dashboardStyles.cardStats}>
                <span>{interviews} interviews</span><span>{offers} offers</span>
              </div>
            </div>
            <Link href="/applications" className={dashboardStyles.overviewLink}>View applications <Icon name="chevron-right" size={15} /></Link>
          </article>

          <article className={dashboardStyles.overviewCard}>
            <div>
              <h2 className={dashboardStyles.overviewTitle}>Job discovery</h2>
              <p className={dashboardStyles.overviewMessage}>Explore opportunities that fit your next career move.</p>
            </div>
            <Link href="/jobs" className={dashboardStyles.overviewLink}>Find jobs <Icon name="chevron-right" size={15} /></Link>
          </article>

          <article className={dashboardStyles.overviewCard}>
            <div>
              <h2 className={dashboardStyles.overviewTitle}>Career snapshot</h2>
              <div className={dashboardStyles.snapshot}>
                <div><p className={dashboardStyles.snapshotValue}>{profileData.skills.length}</p><p className={dashboardStyles.snapshotLabel}>Skills</p></div>
                <div><p className={dashboardStyles.snapshotValue}>{profileData.experience.length}</p><p className={dashboardStyles.snapshotLabel}>Roles</p></div>
                <div><p className={dashboardStyles.snapshotValue}>{profileData.resumes.length ? 'Ready' : 'Add CV'}</p><p className={dashboardStyles.snapshotLabel}>CV</p></div>
              </div>
            </div>
            <Link href="/profile" className={dashboardStyles.overviewLink}>View profile <Icon name="chevron-right" size={15} /></Link>
          </article>
        </section>

        <nav className={dashboardStyles.quickActions} aria-label="Quick actions">
          <Link href="/jobs" className={dashboardStyles.quickAction}><span className={dashboardStyles.quickIcon}><Icon name="search" size={22} /></span><span>Search Jobs</span></Link>
          <Link href="/applications" className={dashboardStyles.quickAction}><span className={dashboardStyles.quickIcon}><Icon name="briefcase" size={22} /></span><span>Applications</span></Link>
          <Link href="/saved-jobs" className={dashboardStyles.quickAction}><span className={dashboardStyles.quickIcon}><Icon name="heart" size={22} /></span><span>Saved Jobs</span></Link>
        </nav>

        <section className={dashboardStyles.section} aria-labelledby="recommended-jobs-title">
          <div className={dashboardStyles.sectionHeader}>
            <h2 id="recommended-jobs-title" className={dashboardStyles.sectionTitle}>Latest opportunities</h2>
            <Link href="/jobs" className={dashboardStyles.sectionLink}>View all</Link>
          </div>
          {publishedJobsResult.error ? (
            <div className={dashboardStyles.emptyState} role="alert"><h3 className={dashboardStyles.emptyTitle}>Jobs are temporarily unavailable</h3><p className={dashboardStyles.emptyText}>We could not load opportunities right now. Please try again later.</p></div>
          ) : publishedJobs.length ? (
            <div className={dashboardStyles.activityList}>
              {publishedJobs.map((job) => {
                const company = firstCompany(job.companies);
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className={dashboardStyles.activityRow}>
                    <span className={dashboardStyles.companyMark}>
                      {company?.logo_url ? <span className={styles.companyLogo} style={{ backgroundImage: `url(${company.logo_url})` }} /> : company?.name?.slice(0, 1).toUpperCase() || 'C'}
                    </span>
                    <span className={dashboardStyles.activityMain}>
                      <span className={dashboardStyles.activityTitle}>{job.title}</span>
                      <span className={dashboardStyles.activitySubtitle}>{company?.name || 'CareerSnap Company'} · {job.location}</span>
                    </span>
                    <span className={dashboardStyles.activityMeta}>{job.employment_type?.replace(/-/g, ' ') || 'Job'} · {job.workplace_type?.replace(/-/g, ' ') || 'Location flexible'}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={dashboardStyles.emptyState}><h3 className={dashboardStyles.emptyTitle}>No published jobs yet</h3><p className={dashboardStyles.emptyText}>New opportunities will appear here when employers publish them.</p></div>
          )}
        </section>

        <section className={dashboardStyles.section} aria-labelledby="application-activity-title">
          <div className={dashboardStyles.sectionHeader}>
            <h2 id="application-activity-title" className={dashboardStyles.sectionTitle}>Recent applications</h2>
            <Link href="/applications" className={dashboardStyles.sectionLink}>View all</Link>
          </div>
          {recentApplicationsResult.error ? (
            <div className={dashboardStyles.emptyState} role="alert"><h3 className={dashboardStyles.emptyTitle}>Applications are temporarily unavailable</h3><p className={dashboardStyles.emptyText}>We could not load your application activity.</p></div>
          ) : recentApplications.length ? (
            <div className={dashboardStyles.activityList}>
              {recentApplications.map((application) => {
                const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
                const company = firstCompany(job?.companies || null);
                return (
                  <Link key={application.id} href="/applications" className={dashboardStyles.activityRow}>
                    <span className={dashboardStyles.companyMark}>{company?.logo_url ? <span className={styles.companyLogo} style={{ backgroundImage: `url(${company.logo_url})` }} /> : company?.name?.slice(0, 1).toUpperCase() || 'C'}</span>
                    <span className={dashboardStyles.activityMain}><span className={dashboardStyles.activityTitle}>{job?.title || 'Job no longer available'}</span><span className={dashboardStyles.activitySubtitle}>{company?.name || 'Company unavailable'}</span></span>
                    <span className={dashboardStyles.activityMeta}><span className={`${dashboardStyles.status} ${['offer', 'accepted', 'hired'].includes(application.status) ? dashboardStyles.statusPositive : ['shortlisted', 'interview'].includes(application.status) ? dashboardStyles.statusAttention : ''}`}>{application.status}</span><time dateTime={application.created_at}>{shortDate(application.created_at)}</time></span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={dashboardStyles.emptyState}><h3 className={dashboardStyles.emptyTitle}>No applications yet</h3><p className={dashboardStyles.emptyText}>Start exploring opportunities that match your skills.</p><Link href="/jobs" className={dashboardStyles.overviewLink}>Find jobs <Icon name="chevron-right" size={15} /></Link></div>
          )}
        </section>
        {Boolean(savedJobsResult.error || applicationStatsResult.error) && <p className={styles.dataNotice} role="status">Some career overview information could not be loaded.</p>}
      </main>
    </AuthenticatedAppShell>
  );
}