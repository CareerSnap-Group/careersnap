'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Job } from '@/lib/types';
import styles from './saved-jobs.module.css';
import { createClient } from '@/lib/supabase/browser';
import { fetchSavedJobs, unsaveJob } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { Icon } from '@/components/icons';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
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
      setUserId(data.user.id);
      const jobs = await fetchSavedJobs(data.user.id);
      if (jobs === null) setError('We could not load your saved jobs. Please try again.');
      setSavedJobs(jobs || []);
      setLoading(false);
    });
  }, []);

  const handleRemove = (jobId: string) => {
    setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
    if (userId) {
      unsaveJob(userId, jobId);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

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

        {loading ? <div className={styles.emptyState}><div className={styles.emptyContent}><p className={styles.emptyDescription}>Loading your saved jobs...</p></div></div> : error ? (
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
              <div key={job.id} className={styles.jobCard}>
                <Card>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <p className={styles.jobCompany}>{job.company.name}</p>
                    </div>
                    <button className={styles.removeButton} onClick={() => handleRemove(job.id)} title="Remove from saved">
                      <Icon name="x" />
                    </button>
                  </div>

                  <div className={styles.jobInfo}>
                    <p><Icon name="map-pin" />{job.location}</p>
                    {job.salary && (
                      <p>
                        <Icon name="dollar-sign" />{job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()} {job.salary.currency}/month
                      </p>
                    )}
                  </div>

                  <div className={styles.badges}>
                    <Badge variant="secondary">{job.jobType}</Badge>
                    <Badge variant="secondary">{job.workLocation}</Badge>
                  </div>

                  <p className={styles.description}>{job.description.substring(0, 100)}...</p>

                  <Link href={`/jobs/${job.id}`}>
                    <Button fullWidth>View Details</Button>
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
