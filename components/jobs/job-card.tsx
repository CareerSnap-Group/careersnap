'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Job } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { saveJob, unsaveJob } from '@/lib/supabase/data';
import styles from './job-card.module.css';

function postedLabel(date: Date) {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

type JobCardProps = {
  job: Job;
  initiallySaved?: boolean;
  savedStateReady?: boolean;
  onSavedChange?: (isSaved: boolean) => void;
};

export function JobCard({ job, initiallySaved = false, savedStateReady = true, onSavedChange }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!savedStateReady) return;
    setIsSaved(initiallySaved);
    setSaveError('');
  }, [initiallySaved, savedStateReady]);

  const toggleSaved = async () => {
    if (saving || !savedStateReady) return;
    if (!isSupabaseConfigured()) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`);
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`);
        return;
      }

      const nextSaved = !isSaved;
      const succeeded = nextSaved
        ? await saveJob(user.id, job.id)
        : await unsaveJob(user.id, job.id);
      if (!succeeded) {
        setSaveError('We could not update this saved job. Please try again.');
        return;
      }

      setIsSaved(nextSaved);
      onSavedChange?.(nextSaved);
    } catch {
      setSaveError('We could not update this saved job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <Link href={`/companies/${job.company.id}`} className={styles.company} aria-label={`${job.company.name} company`}>
          {job.company.logo ? (
            <span className={styles.logo} style={{ backgroundImage: `url(${job.company.logo})` }} role="img" aria-label={`${job.company.name} logo`} />
          ) : (
            <span className={styles.logoFallback} aria-hidden="true">{job.company.name.slice(0, 1).toUpperCase()}</span>
          )}
          <span className={styles.companyName}>{job.company.name}</span>
        </Link>
        <button
          type="button"
          className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
          onClick={toggleSaved}
          disabled={saving || !savedStateReady}
          aria-label={!savedStateReady ? `Checking saved status for ${job.title}` : isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          aria-pressed={isSaved}
        >
          <Icon name={isSaved ? 'heart' : 'heart-off'} size={18} />
        </button>
      </div>

      <h3 className={styles.title}><Link href={`/jobs/${job.id}`}>{job.title}</Link></h3>
      <div className={styles.badges}>
        <Badge variant="success">{job.jobType.replace('-', ' ')}</Badge>
        <Badge variant="warning">{job.workLocation.replace('-', ' ')}</Badge>
      </div>
      <p className={styles.description}>{job.description}</p>
      {saveError && <p className={styles.saveError} role="alert">{saveError}</p>}

      <div className={styles.cardBottom}>
        {job.salary ? (
          <p className={styles.salary}>{job.salary.currency} {job.salary.min.toLocaleString()}–{job.salary.max.toLocaleString()}</p>
        ) : <span />}
        <p className={styles.posted}>{postedLabel(job.postedDate)}</p>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <div className={styles.skeletonTop}><span /><span /></div>
      <span className={styles.skeletonTitle} />
      <span className={styles.skeletonBadges} />
      <span className={styles.skeletonDescription} />
      <span className={styles.skeletonFooter} />
    </article>
  );
}