'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { mockApplications, getJobById } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/browser';
import { fetchApplications, type SupabaseApplication } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import styles from './applications.module.css';

const statusColors = {
  applied: 'secondary',
  viewed: 'primary',
  interview: 'primary',
  offer: 'success',
  rejected: 'danger',
} as const;

export default function ApplicationsPage() {
  const [remoteApplications, setRemoteApplications] = useState<SupabaseApplication[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient().auth.getUser().then(async ({ data }) => {
      if (data.user) setRemoteApplications(await fetchApplications(data.user.id));
    });
  }, []);

  const applications = (remoteApplications || mockApplications).map((app) => ({
    ...app,
    job: getJobById(app.jobId),
  }));

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Application Tracker</h1>
          <p className={styles.subtitle}>Keep track of your job applications and next steps</p>
        </div>

        {applications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <h2 className={styles.emptyTitle}>No applications yet</h2>
              <p className={styles.emptyDescription}>When you apply for jobs, your applications will appear here.</p>
              <Link href="/jobs" className={styles.emptyLink}>
                <button className={styles.emptyButton}>Start Applying</button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className={styles.statsGrid}>
              <Card className={styles.statCard}>
                <p className={styles.statLabel}>Total Applications</p>
                <p className={styles.statValue}>{applications.length}</p>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.statLabel}>Under Review</p>
                <p className={styles.statValue}>{applications.filter((a) => a.status === 'applied' || a.status === 'viewed').length}</p>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.statLabel}>Interviews</p>
                <p className={styles.statValue}>{applications.filter((a) => a.status === 'interview').length}</p>
              </Card>
              <Card className={styles.statCard}>
                <p className={styles.statLabel}>Offers</p>
                <p className={styles.statValue}>{applications.filter((a) => a.status === 'offer').length}</p>
              </Card>
            </div>

            {/* Applications Table */}
            <div className={styles.applicationsCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Applied On</th>
                      <th>Status</th>
                      <th>Next Step</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className={styles.tableRow}>
                        <td className={styles.cellJob}>
                          {app.job?.title || 'Job Removed'}
                        </td>
                        <td className={styles.cellCompany}>
                          {app.job?.company.name || 'N/A'}
                        </td>
                        <td className={styles.cell}>
                          {app.appliedDate.toLocaleDateString()}
                        </td>
                        <td className={styles.cell}>
                          <Badge variant={statusColors[app.status]}>
                            {getStatusLabel(app.status)}
                          </Badge>
                        </td>
                        <td className={styles.cell}>
                          <span className={styles.nextStep}>{app.nextStep || '—'}</span>
                        </td>
                        <td className={styles.cell}>
                          {app.job && (
                            <Link href={`/jobs/${app.job.id}`} className={styles.actionLink}>
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Legend */}
            <div className={styles.legendCard}>
              <h3 className={styles.legendTitle}>Application Status Legend</h3>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <Badge variant="secondary">Applied</Badge>
                  <p>Your application was submitted successfully.</p>
                </div>
                <div className={styles.legendItem}>
                  <Badge variant="primary">Viewed</Badge>
                  <p>The employer has viewed your application.</p>
                </div>
                <div className={styles.legendItem}>
                  <Badge variant="primary">Interview</Badge>
                  <p>You&apos;ve been invited to interview.</p>
                </div>
                <div className={styles.legendItem}>
                  <Badge variant="success">Offer</Badge>
                  <p>You&apos;ve received a job offer!</p>
                </div>
                <div className={styles.legendItem}>
                  <Badge variant="danger">Rejected</Badge>
                  <p>Unfortunately, you weren&apos;t selected.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
