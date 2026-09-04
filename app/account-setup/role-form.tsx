'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import styles from './role-form.module.css';

export function RoleForm() {
  const [role, setRole] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const submit = async () => {
    setLoading(true);
    setError('');
    const response = await fetch('/api/account/role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setError(result.error || 'We could not complete account setup.'); setLoading(false); return; }
    router.push(role === 'employer' ? '/employer/dashboard' : '/job-seeker/dashboard');
    router.refresh();
  };
  return <div className={styles.form}><label><input type="radio" checked={role === 'job_seeker'} onChange={() => setRole('job_seeker')} /> Job Seeker</label><label><input type="radio" checked={role === 'employer'} onChange={() => setRole('employer')} /> Employer</label>{error && <p className={styles.error}>{error}</p>}<Button onClick={submit} disabled={loading}>{loading ? 'Saving...' : 'Continue'}</Button></div>;
}