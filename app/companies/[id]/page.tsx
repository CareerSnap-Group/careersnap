import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RatingSummary } from '@/components/companies/rating-summary';
import { RatingControl } from '@/components/companies/rating-control';
import { Icon } from '@/components/icons';
import { getCompanyProfile } from '@/lib/companies';
import { createClient } from '@/lib/supabase/server';
import styles from './company.module.css';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const company = await getCompanyProfile(params.id);
  return { title: company ? `${company.name} | CareerSnap` : 'Company | CareerSnap' };
}

const socialLinks = [
  { key: 'facebook_url', label: 'Facebook', icon: 'facebook', url: 'facebook_url' },
  { key: 'instagram_url', label: 'Instagram', icon: 'instagram', url: 'instagram_url' },
  { key: 'linkedin_url', label: 'LinkedIn', icon: 'linkedin', url: 'linkedin_url' },
  { key: 'x_url', label: 'X/Twitter', icon: 'x', url: 'x_url' },
  { key: 'tiktok_url', label: 'TikTok', icon: 'tiktok', url: 'tiktok_url' },
  { key: 'youtube_url', label: 'YouTube', icon: 'youtube', url: 'youtube_url' },
] as const;

export default async function CompanyProfilePage({ params }: { params: { id: string } }) {
  const company = await getCompanyProfile(params.id);
  if (!company) notFound();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle() : { data: null };
  const canRate = profile?.user_type === 'job_seeker';
  const availableSocials = socialLinks.filter(({ url }) => Boolean(company[url]));

  return <div className={styles.page}><Header /><main className={styles.container}>
    <Link href="/companies" className={styles.back}>Back to companies</Link>
    <section className={styles.profile}>
      <div className={styles.profileHeader}>
        {company.logo_url ? <div className={styles.logo} style={{ backgroundImage: `url(${company.logo_url})` }} role="img" aria-label={`${company.name} logo`} /> : <div className={styles.logoFallback} aria-hidden="true">{company.name.slice(0, 1).toUpperCase()}</div>}
        <div><h1 className={styles.name}>{company.name}</h1>{company.industry && <p className={styles.meta}>{company.industry}</p>}{company.location && <p className={styles.meta}>{company.location}</p>}<RatingSummary average={company.rating.average} count={company.rating.count} /></div>
      </div>
      {company.description && <p className={styles.description}>{company.description}</p>}
      {(company.website || company.websiteUrl) && <a href={company.website || company.websiteUrl || '#'} className={styles.website} target="_blank" rel="noreferrer">Visit company website</a>}
      {availableSocials.length > 0 && <div className={styles.socials}>{availableSocials.map(({ key, label, icon, url }) => {
        const href = company[url] || '';
        return href ? <a key={key} href={href} className={styles.socialLink} target="_blank" rel="noreferrer" aria-label={label}><span className={styles.socialIcon}><Icon name={icon as any} size={16} /></span>{label}</a> : null;
      })}</div>}
      {!user || canRate ? <RatingControl companyId={company.id} initialRating={canRate ? company.rating.userRating : null} signedIn={Boolean(user)} /> : <p className={styles.meta}>Company ratings are available to Job Seekers.</p>}
    </section>
    <section className={styles.section}><h2 className={styles.sectionTitle}>Active jobs ({company.activeJobCount})</h2>{company.jobs.length ? <div className={styles.jobList}>{company.jobs.map((job) => <article key={job.id} className={styles.job}><h3 className={styles.jobTitle}>{job.title}</h3><p className={styles.jobMeta}>{job.location} · {job.jobType} · {job.workLocation}</p><Link href={`/jobs/${job.id}`} className={styles.jobLink}>View job</Link></article>)}</div> : <div className={styles.empty}>No active jobs are listed by this company.</div>}</section>
  </main><Footer /></div>;
}
