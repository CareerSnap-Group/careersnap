'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getJobById, mockJobs } from '@/lib/mock-data';
import styles from './job-details.module.css';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;
  const job = getJobById(jobId);
  const [isSaved, setIsSaved] = useState(false);

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

  // Get similar jobs (same company or similar title)
  const similarJobs = mockJobs
    .filter((j) => j.id !== job.id && (j.company.id === job.company.id || j.jobType === job.jobType))
    .slice(0, 4);

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
              onClick={() => setIsSaved(!isSaved)}
            >
              {isSaved ? '❤️ Saved' : '🤍 Save Job'}
            </Button>
          </div>
        </div>

        {/* Meta Information */}
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>📍 Location</span>
            <span className={styles.metaValue}>{job.location}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>💼 Type</span>
            <span className={styles.metaValue}>{job.jobType}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>📊 Level</span>
            <span className={styles.metaValue}>{job.experienceLevel}</span>
          </div>
          {job.salary && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>💰 Salary</span>
              <span className={styles.metaValue}>
                {job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()} {job.salary.currency}/month
              </span>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>📅 Posted</span>
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

        <div className={styles.contentLayout}>
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
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
            </section>

            {/* Requirements */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Requirements</h2>
              <ul className={styles.list}>
                {job.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </section>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Benefits</h2>
                <ul className={styles.list}>
                  {job.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Company Information */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About {job.company.name}</h2>
              <Card>
                <h3 className={styles.companyName}>{job.company.name}</h3>
                <p className={styles.companyDescription}>{job.company.description}</p>
                <div className={styles.companyDetails}>
                  <div>
                    <p className={styles.detailLabel}>Industry</p>
                    <p className={styles.detailValue}>{job.company.industry}</p>
                  </div>
                  <div>
                    <p className={styles.detailLabel}>Company Size</p>
                    <p className={styles.detailValue}>{job.company.size}</p>
                  </div>
                  <div>
                    <p className={styles.detailLabel}>Location</p>
                    <p className={styles.detailValue}>{job.company.location}</p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Safety Notice */}
            <div className={styles.safetyNotice}>
              <p className={styles.safetyText}>
                🔒 <strong>Verify employers and never share sensitive information.</strong> CareerSnap is a platform for legitimate recruitment. Always verify job offers and never send money upfront or share personal financial details before confirming employment.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Apply CTA */}
            <div className={styles.ctaBox}>
              <Button fullWidth size="lg" className={styles.applyButton}>
                Apply Now
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => setIsSaved(!isSaved)}
                className={styles.saveButton}
              >
                {isSaved ? '❤️ Saved' : '🤍 Save Job'}
              </Button>
            </div>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className={styles.similarJobs}>
                <h3 className={styles.similarJobsTitle}>Similar Jobs</h3>
                <div className={styles.similarJobsList}>
                  {similarJobs.map((similarJob) => (
                    <Link key={similarJob.id} href={`/jobs/${similarJob.id}`}>
                      <Card hoverable className={styles.similarJobCard}>
                        <h4 className={styles.similarJobTitle}>{similarJob.title}</h4>
                        <p className={styles.similarJobCompany}>{similarJob.company.name}</p>
                        <p className={styles.similarJobLocation}>📍 {similarJob.location}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Job Stats */}
            <Card className={styles.statsCard}>
              <h3 className={styles.statsTitle}>Job Stats</h3>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Applications</span>
                <span className={styles.statValue}>{Math.floor(Math.random() * 100) + 10}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Saves</span>
                <span className={styles.statValue}>{Math.floor(Math.random() * 50) + 5}</span>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
