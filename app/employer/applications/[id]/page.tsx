import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEmployerContext } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { ApplicationReviewPanel } from './review-panel';
import styles from './application-detail.module.css';

type ApplicationRow = {
  id: string;
  applicant_id: string;
  user_id: string;
  resume_id: string | null;
  cover_letter: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  jobs: { title: string; company_id: string } | { title: string; company_id: string }[] | null;
};

type CandidateProfile = { full_name: string | null; email: string | null; phone: string | null; location: string | null; headline: string | null };

export default async function EmployerApplicationDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await getEmployerContext();
  const { data: rawApplication } = await supabase.from('applications').select('id, applicant_id, user_id, resume_id, cover_letter, status, notes, created_at, jobs!inner(title, company_id)').eq('id', params.id).maybeSingle();
  const application = rawApplication as unknown as ApplicationRow | null;
  if (!application || application.applicant_id !== application.user_id) notFound();
  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
  if (!job) notFound();

  const { data: candidate } = await supabase.from('profiles').select('full_name, email, phone, location, headline').eq('id', application.applicant_id).maybeSingle();
  const profile = candidate as CandidateProfile | null;
  return <><Header /><main className={styles.page}><div className={styles.container}><Link href="/employer/applications" className={styles.backLink}>Back to Applications</Link><header className={styles.header}><div><p className={styles.eyebrow}>Application Review</p><h1 className={styles.title}>{profile?.full_name || 'Candidate Application'}</h1><p className={styles.subtitle}>Applied for {job.title} on {new Date(application.created_at).toLocaleDateString()}</p></div><span className={`${styles.status} ${styles[`status${application.status}`]}`}>{application.status}</span></header><div className={styles.grid}><div className={styles.mainColumn}><Card className={styles.card}><h2 className={styles.cardTitle}>Candidate</h2><dl className={styles.details}>{profile?.headline && <><dt>Headline</dt><dd>{profile.headline}</dd></>}{profile?.email && <><dt>Email</dt><dd>{profile.email}</dd></>}{profile?.phone && <><dt>Phone</dt><dd>{profile.phone}</dd></>}{profile?.location && <><dt>Location</dt><dd>{profile.location}</dd></>}</dl></Card><Card className={styles.card}><h2 className={styles.cardTitle}>Cover letter</h2>{application.cover_letter ? <p className={styles.bodyText}>{application.cover_letter}</p> : <p className={styles.muted}>No cover letter was included with this application.</p>}</Card><Card className={styles.card}><h2 className={styles.cardTitle}>Application notes</h2>{application.notes ? <p className={styles.bodyText}>{application.notes}</p> : <p className={styles.muted}>No notes have been added yet.</p>}</Card></div><aside className={styles.sideColumn}><ApplicationReviewPanel applicationId={application.id} status={application.status} notes={application.notes || ''} hasResume={Boolean(application.resume_id)} /></aside></div></div></main><Footer /></>;
}