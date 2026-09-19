'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './company-form.module.css';

type CompanyFormProps = { initial: { name: string; description: string; website: string; location: string; industry: string; logo_url: string } };

export function CompanyForm({ initial }: CompanyFormProps) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    const response = await fetch('/api/employer/company', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) { setError(result?.error || 'We could not update your company profile.'); return; }
    setMessage('Company profile updated.');
  };
  return <form className={styles.form} onSubmit={save}>
    <div className={styles.grid}><Input label="Company name" value={form.name} onChange={(event) => update('name', event.target.value)} required /><Input label="Industry" value={form.industry} onChange={(event) => update('industry', event.target.value)} /><Input label="Location" value={form.location} onChange={(event) => update('location', event.target.value)} /><Input label="Website" type="url" value={form.website} onChange={(event) => update('website', event.target.value)} /><Input label="Logo URL" type="url" value={form.logo_url} onChange={(event) => update('logo_url', event.target.value)} /></div>
    <label className={styles.label} htmlFor="company-description">Description</label><textarea id="company-description" className={styles.textarea} rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} />
    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Company Profile'}</Button>
    {message && <p className={styles.success}>{message}</p>}{error && <p className={styles.error}>{error}</p>}
  </form>;
}
