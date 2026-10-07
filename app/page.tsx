'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';
import { useSavedJobIds } from '@/components/jobs/use-saved-job-ids';
import { Icon } from '@/components/icons';
import { staticCategories } from '@/lib/static-data';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { fetchPublishedJobs } from '@/lib/supabase/data';
import type { Job } from '@/lib/types';
import styles from './page.module.css';

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [employerPromotionDismissed, setEmployerPromotionDismissed] = useState(false);
  const [publishedJobs, setPublishedJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { savedJobIds, savedStateReady, savedStateError } = useSavedJobIds();
  const popularSearches = ['Software Developer', 'Registered Nurse', 'Data Analyst', 'Project Manager', 'Accountant', 'Marketing Manager'];

  const recommendedJobs = useMemo(() => [...publishedJobs]
    .sort((left, right) => sortOrder === 'newest'
      ? right.postedDate.getTime() - left.postedDate.getTime()
      : left.postedDate.getTime() - right.postedDate.getTime())
    .slice(0, 6), [publishedJobs, sortOrder]);

  useEffect(() => {
    setEmployerPromotionDismissed(sessionStorage.getItem('careersnap-employer-promotion-dismissed') === 'true');

    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    fetchPublishedJobs().then((jobs) => {
      if (!active) return;
      if (jobs === null) {
        setPublishedJobs([]);
        setJobsError(true);
      } else {
        setPublishedJobs(jobs);
      }
      setJobsLoading(false);
    }).catch(() => {
      if (!active) return;
      setJobsError(true);
      setJobsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const isLoggedOut = signedIn === false;

  const dismissEmployerPromotion = () => {
    sessionStorage.setItem('careersnap-employer-promotion-dismissed', 'true');
    setEmployerPromotionDismissed(true);
  };

  return (
    <div className={styles.page}>
      <main className={styles.homeBody}>
        <section className={styles.hero}>
          <Header variant="landing" />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Find work that moves your career forward</h1>
            <form className={styles.searchForm} onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const keyword = formData.get('keyword');
              const location = formData.get('location');
              window.location.href = `/jobs?keyword=${keyword}&location=${location}`;
            }}>
              <div className={styles.searchInputs}>
                <div className={styles.searchField}>
                  <Icon name="search" size={21} className={styles.searchIcon} />
                  <Input type="text" name="keyword" placeholder="Job title, keyword, or company" aria-label="Job title, keyword, or company" />
                </div>
                <div className={styles.searchField}>
                  <Icon name="map-pin" size={21} className={styles.locationIcon} />
                  <Input type="text" name="location" placeholder="City, province, or remote" aria-label="City, province, or remote" />
                </div>
                <Button type="submit" size="lg" className={styles.searchButton}>
                  Find jobs
                </Button>
              </div>
            </form>

            {isLoggedOut ? (
              <Link href="/register" className={styles.primaryCta}>Get Started</Link>
            ) : signedIn ? (
              <Link href="/jobs" className={styles.primaryCta}>Find jobs</Link>
            ) : null}
          </div>
        </section>

        <section className={styles.featuredSection} aria-labelledby="recommended-jobs-title">
          <div className={styles.container}>
            <div className={styles.featuredHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Explore opportunities</p>
                <h2 id="recommended-jobs-title" className={styles.sectionTitle}>Recommended Jobs</h2>
              </div>
              <label className={styles.sortControl}>
                <span>Sort by</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}>
                  <option value="newest">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
            {jobsLoading ? (
              <div className={styles.jobsGrid} aria-label="Loading recommended jobs">
                {Array.from({ length: 3 }, (_, index) => <JobCardSkeleton key={index} />)}
              </div>
            ) : jobsError ? (
              <div className={styles.jobsEmpty} role="alert">
                <p>Jobs are temporarily unavailable</p>
                <span>We could not load opportunities right now. Please try again later.</span>
              </div>
            ) : recommendedJobs.length ? (
              <div className={styles.jobsGrid}>
                {recommendedJobs.map((job) => <JobCard key={job.id} job={job} initiallySaved={savedJobIds.has(job.id)} savedStateReady={savedStateReady} />)}
              </div>
            ) : (
              <div className={styles.jobsEmpty}>
                <p>No jobs found</p>
                <span>New published opportunities will appear here.</span>
              </div>
            )}
            {savedStateError && <p className={styles.savedStateNotice} role="status">Saved-job status is unavailable. Save controls are temporarily disabled.</p>}
            <Link href="/jobs" className={styles.viewAllJobs}>Browse all jobs <Icon name="chevron-right" size={16} /></Link>
          </div>
        </section>

        {isLoggedOut && !employerPromotionDismissed && (
          <aside className={styles.employerPromotion} aria-label="Employer promotion">
            <button
              type="button"
              className={styles.dismissPromotion}
              aria-label="Dismiss employer promotion"
              onClick={dismissEmployerPromotion}
            >
              ×
            </button>
            <div>
              <h2 className={styles.employerPromotionTitle}>Are you an employer?</h2>
              <p className={styles.employerPromotionText}>Post a job and reach qualified candidates.</p>
            </div>
            <Link href="/login?next=%2Femployers%2Fpost-job" className={styles.employerPromotionCta}>Post a Job</Link>
          </aside>
        )}

        <section className={styles.trending} aria-label="Popular searches">
          <p className={styles.trendingLabel}>Explore popular searches <Icon name="chevron-down" size={15} /></p>
          <div className={styles.searchTags}>
            {popularSearches.map((search) => (
              <Link key={search} href={`/jobs?keyword=${encodeURIComponent(search)}`} className={styles.searchTag}>
                {search}
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            <div className={styles.categoriesGrid}>
              {staticCategories.map((category) => (
                <Link key={category.id} href={`/jobs?category=${category.id}`}>
                  <Card hoverable className={styles.categoryCard}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
