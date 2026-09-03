'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockJobs } from '@/lib/mock-data';
import styles from './saved-jobs.module.css';
import { createClient } from '@/lib/supabase/browser';
import { fetchSavedJobIds, unsaveJob } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<typeof mockJobs>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      createClient().auth.getUser().then(async ({ data }) => {
        if (!data.user) return;
        setUserId(data.user.id);
        const savedIds = await fetchSavedJobIds(data.user.id);
        if (savedIds) setSavedJobs(mockJobs.filter((job) => savedIds.includes(job.id)));
      });
      return;
    }

    // Load saved jobs from localStorage
    const saved = localStorage.getItem('savedJobs');
    if (saved) {
      const savedIds = JSON.parse(saved);
      const jobs = mockJobs.filter((job) => savedIds.includes(job.id));
      setSavedJobs(jobs);
    }
  }, []);

  const handleRemove = (jobId: string) => {
    setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
    if (userId) {
      unsaveJob(userId, jobId);
      return;
    }
    const saved = localStorage.getItem('savedJobs');
    if (saved) {
      const savedIds = JSON.parse(saved).filter((id: string) => id !== jobId);
      localStorage.setItem('savedJobs', JSON.stringify(savedIds));
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

        {savedJobs.length === 0 ? (
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
                      ❌
                    </button>
                  </div>

                  <div className={styles.jobInfo}>
                    <p>📍 {job.location}</p>
                    {job.salary && (
                      <p>
                        💰 {job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()} {job.salary.currency}/month
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
