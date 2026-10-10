'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Job } from '@/lib/types';
import styles from './saved-jobs.module.css';
import { createClient } from '@/lib/supabase/browser';
import { fetchSavedJobs } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) { setError('Saved jobs are unavailable until your CareerSnap account is connected.'); setLoading(false); return; }
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setError('Please sign in to view your saved jobs.');
        setLoading(false);
        return;
      }
      const jobs = await fetchSavedJobs(data.user.id);
      if (jobs === null) setError('We could not load your saved jobs. Please try again.');
      setSavedJobs(jobs || []);
      setLoading(false);
    });
  }, []);

  const handleRemove = (jobId: string) => {
    setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Saved Jobs</h1>
            <p className={styles.subtitle}>Your collection of interesting opportunities</p>
          </div>
          <Link href="/jobs">
            <Button>Browse More Jobs</Button>
          </Link>
        </div>

        {loading ? <div className={styles.jobsGrid} aria-label="Loading saved jobs">{Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)}</div> : error ? (
          <div className={styles.emptyState}><div className={styles.emptyContent}><h2 className={styles.emptyTitle}>Saved jobs unavailable</h2><p className={styles.emptyDescription}>{error}</p></div></div>
        ) : savedJobs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <h2 className={styles.emptyTitle}>No saved jobs yet</h2>
              <p className={styles.emptyDescription}>Start exploring jobs and save ones that interest you to review them later.</p>
              <Link href="/jobs">
                <Button size="lg">Start Searching</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.jobsGrid}>
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} initiallySaved onSavedChange={(isSaved) => { if (!isSaved) handleRemove(job.id); }} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
