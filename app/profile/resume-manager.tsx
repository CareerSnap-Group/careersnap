'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/icons';
import styles from './profile.module.css';

type Resume = { id: string; file_name: string; is_primary: boolean; is_default: boolean; created_at: string };

export function ResumeManager() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadResumes = async () => {
    const response = await fetch('/api/resumes');
    const result = await response.json() as { resumes?: Resume[]; error?: string };
    if (!response.ok) { setError(result.error || 'We could not load your CVs.'); setLoading(false); return; }
    setResumes(result.resumes || []);
    setLoading(false);
  };

  useEffect(() => { void loadResumes(); }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true); setError(''); setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/resumes', { method: 'POST', body: formData });
    const result = await response.json() as { error?: string };
    setUploading(false);
    if (!response.ok) { setError(result.error || 'We could not upload your CV.'); return; }
    setMessage('CV uploaded successfully.');
    await loadResumes();
  };

  const setPrimary = async (id: string) => {
    setBusyId(id); setError(''); setMessage('');
    const response = await fetch(`/api/resumes/${id}`, { method: 'PATCH' });
    const result = await response.json() as { error?: string };
    setBusyId('');
    if (!response.ok) { setError(result.error || 'We could not update your primary CV.'); return; }
    setMessage('Primary CV updated.');
    await loadResumes();
  };

  const viewResume = async (id: string) => {
    setBusyId(id); setError('');
    const response = await fetch(`/api/resumes/${id}`);
    const result = await response.json() as { url?: string; error?: string };
    setBusyId('');
    if (!response.ok || !result.url) { setError(result.error || 'We could not open your CV.'); return; }
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  const deleteResume = async (resume: Resume) => {
    if (!window.confirm(`Delete ${resume.file_name}? This cannot be undone.`)) return;
    setBusyId(resume.id); setError(''); setMessage('');
    const response = await fetch(`/api/resumes/${resume.id}`, { method: 'DELETE' });
    const result = await response.json() as { error?: string };
    setBusyId('');
    if (!response.ok) { setError(result.error || 'We could not delete your CV.'); return; }
    setMessage('CV deleted. Existing applications remain intact.');
    await loadResumes();
  };

  return <div className={styles.resumeManager}>
    <div className={styles.cvUpload}><label className={styles.uploadBox}><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={handleUpload} disabled={uploading} /><span><Icon name="file" />{uploading ? 'Uploading...' : 'Upload CV'}</span></label></div>
    <p className={styles.cvHint}>PDF, DOC, or DOCX up to 5MB</p>
    {error && <p className={styles.resumeError}>{error}</p>}
    {message && <p className={styles.resumeSuccess}>{message}</p>}
    {loading ? <p className={styles.resumeHint}>Loading your CVs...</p> : resumes.length === 0 ? <p className={styles.resumeHint}>No CVs uploaded yet. Upload one to include it in applications.</p> : <div className={styles.resumeList}>{resumes.map((resume) => <div className={styles.resumeRow} key={resume.id}><div className={styles.resumeDetails}><p className={styles.resumeName}>{resume.file_name}</p><p className={styles.resumeMeta}>Uploaded {new Date(resume.created_at).toLocaleDateString()}{resume.is_primary || resume.is_default ? ' · Primary' : ''}</p></div><div className={styles.resumeActions}><Button type="button" variant="ghost" size="sm" onClick={() => viewResume(resume.id)} disabled={busyId === resume.id}>View</Button>{!(resume.is_primary || resume.is_default) && <Button type="button" variant="ghost" size="sm" onClick={() => setPrimary(resume.id)} disabled={busyId === resume.id}>Make Primary</Button>}<Button type="button" variant="ghost" size="sm" onClick={() => deleteResume(resume)} disabled={busyId === resume.id}>Delete</Button></div></div>)}</div>}
  </div>;
}