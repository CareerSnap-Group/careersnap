'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import styles from './job-details.module.css';
import { createClient } from '@/lib/supabase/browser';
import { fetchPublishedJobById, fetchPublishedJobs, saveJob, unsaveJob, fetchSavedJobIds } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { Icon } from '@/components/icons';
import { ApplicationForm } from './application-form';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Awaited<ReturnType<typeof fetchPublishedJobById>>>(null);
  const [loading, setLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState<NonNullable<Awaited<ReturnType<typeof fetchPublishedJobs>>>>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Promise.all([fetchPublishedJobById(jobId), fetchPublishedJobs()]).then(([publishedJob, publishedJobs]) => {
      if (!active) return;
      setJob(publishedJob);
      setSimilarJobs(publishedJob ? (publishedJobs || []).filter((candidate) => candidate.id !== publishedJob.id && (candidate.company.id === publishedJob.company.id || candidate.jobType === publishedJob.jobType)).slice(0, 4) : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [jobId]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !job) return;
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const savedIds = await fetchSavedJobIds(data.user.id);
      setIsSaved(Boolean(savedIds?.includes(job.id)));
      if (new URLSearchParams(window.location.search).get('apply') === '1') setShowApplicationForm(true);
    });
  }, [job]);

  useEffect(() => {
    if (!job || typeof window === 'undefined') return;
    const viewedKey = `careersnap-job-viewed-${job.id}`;
    if (sessionStorage.getItem(viewedKey)) return;
    const viewerKey = localStorage.getItem('careersnap-viewer-key') || crypto.randomUUID();
    localStorage.setItem('careersnap-viewer-key', viewerKey);
    sessionStorage.setItem(viewedKey, 'true');
    fetch(`/api/jobs/${job.id}/view`, { method: 'POST', headers: { 'x-careersnap-viewer': viewerKey } }).catch(() => undefined);
  }, [job]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={`${styles.container} ${styles.loadingContainer}`} aria-label="Loading job details">
          <div className={styles.skeletonHeader}><span /><span /></div>
          <div className={styles.skeletonMeta}>{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
          <div className={styles.contentLayout}>
            <aside className={styles.skeletonRelated}><span /><span /><span /></aside>
            <div className={styles.skeletonMain}><span /><span /><span /><span /><span /></div>
            <aside className={styles.skeletonCompany}><span /><span /><span /></aside>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const toggleSaved = async () => {
    if (!job || !isSupabaseConfigured()) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }
    setSaveError('');
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) {
        router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`);
        return;
      }
      const nextSaved = !isSaved;
      const succeeded = nextSaved
        ? await saveJob(data.user.id, job.id)
        : await unsaveJob(data.user.id, job.id);
      if (!succeeded) {
        setSaveError('We could not update this saved job. Please try again.');
        return;
      }
      setIsSaved(nextSaved);
    } catch {
      setSaveError('We could not update this saved job. Please try again.');
    }
  };

  const handleApply = async () => {
    if (!isSupabaseConfigured()) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}?apply=1`)}`);
      return;
    }
    const { data } = await createClient().auth.getUser();
    if (!data.user) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}?apply=1`)}`);
      return;
    }
    setShowApplicationForm(true);
  };

  if (!job) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.notFound}>
          <div className={styles.notFoundContent}>
            <h1>Job not found</h1>
            <p>The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{job.title}</h1>
            <p className={styles.company}>{job.company.name}</p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant={isSaved ? 'secondary' : 'outline'}
              onClick={toggleSaved}
            >
              <Icon name={isSaved ? 'heart' : 'heart-off'} />{isSaved ? 'Saved' : 'Save Job'}
            </Button>
          </div>
        </div>

        {/* Meta Information */}
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}><Icon name="map-pin" />Location</span>
            <span className={styles.metaValue}>{job.location}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}><Icon name="briefcase" />Type</span>
            <span className={styles.metaValue}>{job.jobType}</span>
          </div>
          {job.salary && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}><Icon name="dollar-sign" />Salary</span>
              <span className={styles.metaValue}>
                {job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()} {job.salary.currency}/month
              </span>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}><Icon name="calendar" />Posted</span>
            <span className={styles.metaValue}>
              {Math.floor((new Date().getTime() - job.postedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className={styles.badges}>
          <Badge variant="primary">{job.workLocation}</Badge>
          {job.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className={`${styles.contentLayout} ${similarJobs.length === 0 ? styles.contentLayoutNoRelated : ''}`}>
          {similarJobs.length > 0 && <aside className={styles.relatedColumn} aria-label="Related jobs">
              <h2 className={styles.relatedTitle}>Related jobs</h2>
              <div className={styles.similarJobsList}>
                {similarJobs.map((similarJob) => (
                  <Link key={similarJob.id} href={`/jobs/${similarJob.id}`}>
                    <Card hoverable className={styles.similarJobCard}>
                      <h3 className={styles.similarJobTitle}>{similarJob.title}</h3>
                      <p className={styles.similarJobCompany}>{similarJob.company.name}</p>
                      <p className={styles.similarJobLocation}><Icon name="map-pin" />{similarJob.location}</p>
                    </Card>
                  </Link>
                ))}
              </div>
          </aside>}

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* About the Role */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About the role</h2>
              <p className={styles.sectionText}>{job.description}</p>
            </section>

            {/* Responsibilities */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Responsibilities</h2>
              <ul className={styles.list}>
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx}><Icon name="check" />{resp}</li>
                ))}
              </ul>
            </section>

            {/* Requirements */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Requirements</h2>
              <ul className={styles.list}>
                {job.requirements.map((req, idx) => (
                  <li key={idx}><Icon name="check" />{req}</li>
                ))}
              </ul>
            </section>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Benefits</h2>
                <ul className={styles.list}>
                  {job.benefits.map((benefit, idx) => (
                    <li key={idx}><Icon name="check" />{benefit}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Safety Notice */}
            <div className={styles.safetyNotice}>
              <p className={styles.safetyText}>
                <Icon name="lock" /><strong>Verify employers and never share sensitive information.</strong> CareerSnap is a platform for legitimate recruitment. Always verify job offers and never send money upfront or share personal financial details before confirming employment.
              </p>
            </div>
          </div>

          {/* Company and application panel */}
          <aside className={styles.sidebar}>
            <Card className={styles.companyCard}>
              <div className={styles.companyIntro}>
                {job.company.logo ? <div className={styles.companyLogoLarge} style={{ backgroundImage: `url(${job.company.logo})` }} role="img" aria-label={`${job.company.name} logo`} /> : <div className={styles.companyLogoLargeFallback} aria-hidden="true">{job.company.name.slice(0, 1).toUpperCase()}</div>}
                <div>
                  <h2 className={styles.companyName}>{job.company.name}</h2>
                  {job.company.industry && job.company.industry !== 'Various industries' && <p className={styles.companyIndustry}>{job.company.industry}</p>}
                </div>
              </div>
              {job.company.description && <p className={styles.companyDescription}>{job.company.description}</p>}
              {job.company.website && <a className={styles.companyWebsite} href={job.company.website} target="_blank" rel="noreferrer">Visit company website</a>}
              <Link href={`/companies/${job.company.id}`} className={styles.companyProfileLink}>View company profile</Link>
            </Card>

            {/* Apply CTA */}
            <div className={styles.ctaBox}>
              {applicationSubmitted ? <p className={styles.applicationSuccess}><Icon name="check" />Application submitted</p> : <Button fullWidth size="lg" className={styles.applyButton} onClick={handleApply}>Apply Now</Button>}
              {saveError && <p className={styles.applicationError} role="alert">{saveError}</p>}
              <Button
                fullWidth
                variant="outline"
                onClick={toggleSaved}
                className={styles.saveButton}
              >
                <Icon name={isSaved ? 'heart' : 'heart-off'} />{isSaved ? 'Saved' : 'Save Job'}
              </Button>
            </div>

            {showApplicationForm && !applicationSubmitted && <ApplicationForm jobId={jobId} onSubmitted={() => { setShowApplicationForm(false); setApplicationSubmitted(true); }} />}

          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
