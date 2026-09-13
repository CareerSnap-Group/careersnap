'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import styles from './jobs.module.css';

export function JobActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const updateStatus = async (nextStatus: string) => {
    setBusy(true); setError('');
    const response = await fetch(`/api/employer/jobs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
    setBusy(false);
    if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error || 'Could not update job status.'); return; }
    window.location.reload();
  };

  const deleteJob = async () => {
    if (!window.confirm('Delete this job? This action cannot be undone.')) return;
    setBusy(true); setError('');
    const response = await fetch(`/api/employer/jobs/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error || 'Could not delete this job.'); return; }
    window.location.reload();
  };

  return <div className={styles.actionsCell}>
    <a href={`/employer/jobs/${id}/edit`} className={styles.tableAction}>Edit <Icon name="chevron-right" size={14} /></a>
    {status === 'draft' && <button type="button" className={styles.tableAction} onClick={() => updateStatus('published')} disabled={busy}>Publish <Icon name="chevron-right" size={14} /></button>}
    {status === 'published' && <button type="button" className={styles.tableAction} onClick={() => updateStatus('closed')} disabled={busy}>Close <Icon name="chevron-right" size={14} /></button>}
    {status === 'closed' && <button type="button" className={styles.tableAction} onClick={() => updateStatus('published')} disabled={busy}>Reopen <Icon name="chevron-right" size={14} /></button>}
    <button type="button" className={styles.deleteAction} onClick={deleteJob} disabled={busy}>Delete</button>
    {error && <span className={styles.actionError}>{error}</span>}
  </div>;
}