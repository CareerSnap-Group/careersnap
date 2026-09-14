'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import styles from './application-detail.module.css';

const statuses = ['submitted', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'] as const;

export function ApplicationReviewPanel({ applicationId, status: initialStatus, notes: initialNotes, hasResume }: { applicationId: string; status: string; notes: string; hasResume: boolean }) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const saveChanges = async () => {
    setSaving(true); setError(''); setMessage('');
    const response = await fetch(`/api/employer/applications/${applicationId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes }) });
    const result = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) { setError(result.error || 'We could not update this application.'); return; }
    setMessage('Application updated.');
  };

  const openResume = async () => {
    setResumeLoading(true); setError('');
    const response = await fetch(`/api/employer/applications/${applicationId}/resume`);
    const result = await response.json() as { url?: string; error?: string };
    setResumeLoading(false);
    if (!response.ok || !result.url) { setError(result.error || 'We could not open this CV.'); return; }
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  return <><Card className={styles.card}><h2 className={styles.cardTitle}>Review actions</h2><label className={styles.label} htmlFor="application-status">Status</label><select id="application-status" className={styles.select} value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option value={value} key={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select><label className={styles.label} htmlFor="application-notes">Notes</label><textarea id="application-notes" className={styles.textarea} rows={6} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add internal notes about this application." /><Button type="button" fullWidth onClick={saveChanges} disabled={saving}>{saving ? 'Saving...' : 'Save Updates'}</Button>{message && <p className={styles.success}>{message}</p>}{error && <p className={styles.error}>{error}</p>}</Card><Card className={styles.card}><h2 className={styles.cardTitle}>Candidate CV</h2>{hasResume ? <Button type="button" variant="outline" fullWidth onClick={openResume} disabled={resumeLoading}>{resumeLoading ? 'Opening...' : 'Open CV'}</Button> : <p className={styles.muted}>No CV attached to this application.</p>}</Card></>;
}