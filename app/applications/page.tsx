'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/browser';
import { fetchApplications, type SupabaseApplication } from '@/lib/supabase/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import styles from './applications.module.css';

const statusColors = {
  applied: 'secondary',
  viewed: 'primary',
  submitted: 'secondary',
  reviewing: 'primary',
  shortlisted: 'primary',
  interview: 'primary',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
} as const;

export default function ApplicationsPage() {
  const [remoteApplications, setRemoteApplications] = useState<SupabaseApplication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) { setError('Applications are unavailable until your CareerSnap account is connected.'); setLoading(false); return; }
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setError('Please sign in to view your applications.');
        setRemoteApplications([]);
      } else {
        const applications = await fetchApplications(data.user.id);
        if (applications === null) setError('We could not load your applications. Please try again.');
        setRemoteApplications(applications || []);
      }
      setLoading(false);
    });
  }, []);

  const applications = remoteApplications || [];

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

        {loading ? <div className={styles.emptyState}><div className={styles.emptyContent}><p className={styles.emptyDescription}>Loading your applications...</p></div></div> : error ? (
          <div className={styles.emptyState}><div className={styles.emptyContent}><h2 className={styles.emptyTitle}>Applications unavailable</h2><p className={styles.emptyDescription}>{error}</p></div></div>
        ) : applications.length === 0 ? (
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
                          {app.job?.title || 'Job no longer available'}
                        </td>
                        <td className={styles.cellCompany}>
                          {app.job?.company.name || 'Unavailable'}
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
