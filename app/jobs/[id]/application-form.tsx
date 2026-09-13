'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/browser';
import styles from './job-details.module.css';

type ResumeOption = { id: string; file_name: string; is_primary: boolean };

export function ApplicationForm({ jobId, onSubmitted }: { jobId: string; onSubmitted: () => void }) {
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    createClient().from('resumes').select('id, file_name, is_primary').order('is_primary', { ascending: false }).order('created_at', { ascending: false }).then(({ data }) => {
      const available = (data || []) as ResumeOption[];
      setResumes(available);
      setResumeId(available[0]?.id || '');
      setLoadingResumes(false);
    });
  }, []);

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const response = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId, resumeId: resumeId || null, coverLetter }) });
    const result = await response.json() as { error?: string };
    setSubmitting(false);
    if (!response.ok) { setError(result.error || 'We could not submit your application.'); return; }
    onSubmitted();
  };

  return <Card className={styles.applicationCard}>
    <div className={styles.applicationHeader}><div><h2 className={styles.sectionTitle}>Apply for this role</h2><p className={styles.sectionText}>Submit your application securely to the employer.</p></div><button type="button" className={styles.closeApplication} onClick={onSubmitted} aria-label="Close application form"><Icon name="x" /></button></div>
    <form onSubmit={submitApplication} className={styles.applicationForm}>
      {error && <p className={styles.applicationError}>{error}</p>}
      <div><label htmlFor="application-resume" className={styles.applicationLabel}>Resume</label>{loadingResumes ? <p className={styles.applicationHint}>Loading your resumes...</p> : resumes.length ? <select id="application-resume" value={resumeId} onChange={(event) => setResumeId(event.target.value)} className={styles.applicationSelect}><option value="">Apply without a resume</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.file_name}{resume.is_primary ? ' (Primary)' : ''}</option>)}</select> : <p className={styles.applicationHint}>No resume is available. You can still apply with a cover letter.</p>}</div>
      <div><label htmlFor="application-cover-letter" className={styles.applicationLabel}>Cover letter (optional)</label><textarea id="application-cover-letter" value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} className={styles.applicationTextarea} rows={7} placeholder="Tell the employer why you are a strong fit for this role." /></div>
      <div className={styles.applicationActions}><Button type="submit" size="lg" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</Button><Button type="button" variant="outline" size="lg" onClick={onSubmitted}>Cancel</Button></div>
    </form>
  </Card>;
}