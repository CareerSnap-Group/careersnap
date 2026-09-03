'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { mockJobs, searchJobs, filterJobs } from '@/lib/mock-data';
import { Job, JobType, ExperienceLevel, WorkLocation } from '@/lib/types';
import styles from './jobs.module.css';
import { fetchPublishedJobs } from '@/lib/supabase/data';

function JobsContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';
  const initialLocation = searchParams.get('location') || '';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [selectedJobType, setSelectedJobType] = useState<JobType | ''>('');
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | ''>('');
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<WorkLocation | ''>('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [availableJobs, setAvailableJobs] = useState(mockJobs);

  useEffect(() => {
    fetchPublishedJobs().then((jobs) => {
      if (jobs?.length) setAvailableJobs(jobs);
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

  const selectedJob = selectedJobId ? filteredJobs.find((j) => j.id === selectedJobId) : filteredJobs[0];

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
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={styles.searchInput}
            />
            <Input
              type="text"
              placeholder="City, province, or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={styles.searchInput}
            />
            <Button type="submit">Search</Button>
          </div>
        </form>

        <div className={styles.content}>
          {/* Filters Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.filterSection}>
              <h3 className={styles.filterTitle}>Filters</h3>

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
              <h2 className={styles.resultsCount}>{filteredJobs.length} jobs found</h2>
            </div>

            {filteredJobs.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateTitle}>No jobs found</p>
                <p className={styles.emptyStateDescription}>Try adjusting your search or filters to find more results.</p>
              </div>
            ) : (
              <div className={styles.resultsLayout}>
                {/* Job List */}
                <div className={styles.jobList}>
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className={`${styles.jobListItem} ${selectedJob?.id === job.id ? styles.selected : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <Link href={`/jobs/${job.id}`}>
                        <Card className={styles.jobCardSmall}>
                          <h3 className={styles.jobCardTitle}>{job.title}</h3>
                          <p className={styles.jobCardCompany}>{job.company.name}</p>
                          <div className={styles.jobCardInfo}>
                            <p>📍 {job.location}</p>
                            {job.salary && (
                              <p>
                                💰 {job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()} {job.salary.currency}
                              </p>
                            )}
                          </div>
                          <div className={styles.jobCardBadges}>
                            <Badge variant="secondary">{job.jobType}</Badge>
                            <Badge variant="secondary">{job.workLocation}</Badge>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Job Details */}
                {selectedJob && (
                  <div className={styles.jobDetails}>
                    <Link href={`/jobs/${selectedJob.id}`} className={styles.jobDetailsContent}>
                      <div className={styles.detailsHeader}>
                        <div>
                          <h2 className={styles.detailsTitle}>{selectedJob.title}</h2>
                          <p className={styles.detailsCompany}>{selectedJob.company.name}</p>
                        </div>
                      </div>

                      <div className={styles.detailsMeta}>
                        <div>
                          <p className={styles.metaLabel}>Location</p>
                          <p className={styles.metaValue}>{selectedJob.location}</p>
                        </div>
                        <div>
                          <p className={styles.metaLabel}>Type</p>
                          <p className={styles.metaValue}>{selectedJob.jobType}</p>
                        </div>
                        {selectedJob.salary && (
                          <div>
                            <p className={styles.metaLabel}>Salary</p>
                            <p className={styles.metaValue}>
                              {selectedJob.salary.min.toLocaleString()}-{selectedJob.salary.max.toLocaleString()} {selectedJob.salary.currency}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className={styles.detailsBadges}>
                        <Badge variant="secondary">{selectedJob.workLocation}</Badge>
                        <Badge variant="secondary">{selectedJob.experienceLevel}</Badge>
                      </div>

                      <div className={styles.detailsDescription}>
                        <h3 className={styles.sectionTitle}>About the role</h3>
                        <p>{selectedJob.description}</p>
                      </div>

                      <div className={styles.detailsSection}>
                        <h3 className={styles.sectionTitle}>Responsibilities</h3>
                        <ul>
                          {selectedJob.responsibilities.map((resp, idx) => (
                            <li key={idx}>{resp}</li>
                          ))}
                        </ul>
                      </div>

                      <div className={styles.detailsSection}>
                        <h3 className={styles.sectionTitle}>Requirements</h3>
                        <ul>
                          {selectedJob.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      {selectedJob.benefits && (
                        <div className={styles.detailsSection}>
                          <h3 className={styles.sectionTitle}>Benefits</h3>
                          <ul>
                            {selectedJob.benefits.map((benefit, idx) => (
                              <li key={idx}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Link>

                    <div className={styles.detailsActions}>
                      <Link href={`/jobs/${selectedJob.id}`} className={styles.actionLink}>
                        <Button fullWidth>View Full Details & Apply</Button>
                      </Link>
                    </div>
                  </div>
                )}
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
