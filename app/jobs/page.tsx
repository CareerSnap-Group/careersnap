'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Job, JobType, ExperienceLevel, WorkLocation } from '@/lib/types';
import { Icon } from '@/components/icons';
import styles from './jobs.module.css';
import { fetchPublishedJobs } from '@/lib/supabase/data';
import { JobCard, JobCardSkeleton } from '@/components/jobs/job-card';

function searchJobs(query: string, jobs: Job[]): Job[] {
  if (!query.trim()) return jobs;
  const lowerQuery = query.toLowerCase();
  return jobs.filter((job) =>
    job.title.toLowerCase().includes(lowerQuery) ||
    job.company.name.toLowerCase().includes(lowerQuery) ||
    job.description.toLowerCase().includes(lowerQuery) ||
    job.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

function filterJobs(jobs: Job[], filters: { jobType?: string; experienceLevel?: string; workLocation?: string; location?: string }): Job[] {
  return jobs.filter((job) => {
    if (filters.jobType && job.jobType !== filters.jobType) return false;
    if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) return false;
    if (filters.workLocation && job.workLocation !== filters.workLocation) return false;
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';
  const initialLocation = searchParams.get('location') || '';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [selectedJobType, setSelectedJobType] = useState<JobType | ''>('');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | ''>('');
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<WorkLocation | ''>('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedJobs().then((jobs) => {
      setAvailableJobs(jobs || []);
      setLoading(false);
    });
  }, []);

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let results = searchJobs(keyword, availableJobs);

    results = filterJobs(results, {
      jobType: selectedJobType,
      experienceLevel: selectedExperience,
      workLocation: selectedWorkLocation,
      location: location,
    });

    return results;
  }, [availableJobs, keyword, location, selectedJobType, selectedExperience, selectedWorkLocation]);

  const sortedJobs = useMemo(() => [...filteredJobs].sort((left, right) => sortOrder === 'newest'
    ? right.postedDate.getTime() - left.postedDate.getTime()
    : left.postedDate.getTime() - right.postedDate.getTime()), [filteredJobs, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already reflected in state
  };

  const clearFilters = () => {
    setKeyword('');
    setLocation('');
    setSelectedJobType('');
    setSelectedExperience('');
    setSelectedWorkLocation('');
    setFilterPanelOpen(false);
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        {/* Search Bar */}
        <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
          <div className={styles.searchInputs}>
            <Input
              type="text"
              placeholder="Job title, keyword, or company"
              aria-label="Job title, keyword, or company"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={styles.searchInput}
            />
            <Input
              type="text"
              placeholder="City, province, or remote"
              aria-label="City, province, or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.searchInput}
            />
            <Button type="submit">Search</Button>
          </div>
        </form>

        <div className={styles.mobileToolbar}>
          <Button
            variant="outline"
            className={styles.mobileFilterButton}
            onClick={() => setFilterPanelOpen((open) => !open)}
            aria-expanded={filterPanelOpen}
            aria-controls="job-filter-panel"
          >
            <Icon name="filter" size={16} />Filters
          </Button>
          <span>{filteredJobs.length} jobs</span>
        </div>

        <div className={styles.content}>
          {/* Filters Sidebar */}
          <aside id="job-filter-panel" className={`${styles.sidebar} ${filterPanelOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.filterSection}>
              <div className={styles.filterHeader}>
                <h3 className={styles.filterTitle}>Filters</h3>
                <button type="button" className={styles.filterClose} onClick={() => setFilterPanelOpen(false)} aria-label="Close filters"><Icon name="x" /></button>
              </div>

              {/* Job Type */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Job Type</label>
                <div className={styles.filterOptions}>
                  {(['full-time', 'part-time', 'contract', 'temporary', 'internship'] as JobType[]).map((type) => (
                    <label key={type} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedJobType === type}
                        onChange={() => setSelectedJobType(selectedJobType === type ? '' : type)}
                      />
                      <span className={styles.checkboxText}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Experience Level</label>
                <div className={styles.filterOptions}>
                  {(['entry', 'mid', 'senior', 'executive'] as ExperienceLevel[]).map((level) => (
                    <label key={level} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedExperience === level}
                        onChange={() => setSelectedExperience(selectedExperience === level ? '' : level)}
                      />
                      <span className={styles.checkboxText}>{level.charAt(0).toUpperCase() + level.slice(1)} Level</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Work Location */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Work Location</label>
                <div className={styles.filterOptions}>
                  {(['remote', 'hybrid', 'on-site'] as WorkLocation[]).map((loc) => (
                    <label key={loc} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedWorkLocation === loc}
                        onChange={() => setSelectedWorkLocation(selectedWorkLocation === loc ? '' : loc)}
                      />
                      <span className={styles.checkboxText}>{loc.charAt(0).toUpperCase() + loc.slice(1).replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <Button variant="ghost" fullWidth onClick={clearFilters} className={styles.clearButton}>
                Clear Filters
              </Button>
            </div>
          </aside>

          {/* Results Area */}
          <div className={styles.results}>
            {/* Results Header */}
            <div className={styles.resultsHeader}>
              <div>
                <h1 className={styles.resultsTitle}>Recommended Jobs</h1>
                <p className={styles.resultsCount}>{filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found</p>
              </div>
              <label className={styles.sortControl}>
                <span>Sort by</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}>
                  <option value="newest">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className={styles.jobGrid} aria-label="Loading jobs">
                {Array.from({ length: 6 }, (_, index) => <JobCardSkeleton key={index} />)}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateTitle}>No jobs found</p>
                <p className={styles.emptyStateDescription}>{availableJobs.length === 0 ? 'Published opportunities will appear here when employers post them.' : 'Try adjusting your search criteria or removing some filters.'}</p>
                <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              </div>
            ) : (
              <div className={styles.jobGrid}>
                {sortedJobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading jobs...</div>}>
      <JobsContent />
    </Suspense>
  );
}
