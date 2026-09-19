'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './company-form.module.css';

type CompanyFormProps = { initial: { name: string; description: string; website: string; location: string; industry: string; logo_url: string; facebook_url: string; instagram_url: string; linkedin_url: string; x_url: string; tiktok_url: string; youtube_url: string } };

const socialFields = [
  { key: 'facebook_url', label: 'Facebook URL', platform: 'facebook' },
  { key: 'instagram_url', label: 'Instagram URL', platform: 'instagram' },
  { key: 'linkedin_url', label: 'LinkedIn URL', platform: 'linkedin' },
  { key: 'x_url', label: 'X/Twitter URL', platform: 'x' },
  { key: 'tiktok_url', label: 'TikTok URL', platform: 'tiktok' },
  { key: 'youtube_url', label: 'YouTube URL', platform: 'youtube' },
] as const;

export function CompanyForm({ initial }: CompanyFormProps) {
  const [form, setForm] = useState(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url || null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const currentLogoUrl = useMemo(() => logoPreview || form.logo_url || '', [logoPreview, form.logo_url]);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setLogoFile(selected);
    if (!selected) {
      setLogoPreview(form.logo_url || null);
      return;
    }
    const nextPreview = URL.createObjectURL(selected);
    setLogoPreview(nextPreview);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setForm((current) => ({ ...current, logo_url: '' }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    const payload = new FormData();
    const fields: Array<[string, string]> = [
      ['name', form.name],
      ['description', form.description],
      ['website', form.website],
      ['location', form.location],
      ['industry', form.industry],
      ['logo_url', form.logo_url],
      ...socialFields.map(({ key }) => [key, form[key]] as [string, string]),
    ];
    fields.forEach(([key, value]) => payload.append(key, value));
    if (logoFile) payload.append('logo_file', logoFile);
    if (!logoFile && !form.logo_url) payload.append('remove_logo', 'true');

    const response = await fetch('/api/employer/company', { method: 'PATCH', body: payload });
    const result = await response.json().catch(() => null) as { error?: string; logo_url?: string | null } | null;
    setSaving(false);
    if (!response.ok) { setError(result?.error || 'We could not update your company profile.'); return; }
    if (result?.logo_url) {
      setForm((current) => ({ ...current, logo_url: result.logo_url ?? '' }));
      setLogoPreview(result.logo_url ?? '' );
    }
    setMessage('Company profile updated.');
  };

  return <form className={styles.form} onSubmit={save}>
    <div className={styles.logoCard}>
      <div className={styles.logoPreviewWrap}>
        {currentLogoUrl ? <img src={currentLogoUrl} alt="Company logo preview" className={styles.logoPreview} /> : <div className={styles.logoFallback}>C</div>}
      </div>
      <div className={styles.logoActions}>
        <label className={styles.fileLabel}>
          <span>Upload company logo</span>
          <input type="file" accept="image/*" onChange={handleLogoChange} />
        </label>
        {(currentLogoUrl || logoFile) && <button type="button" className={styles.removeButton} onClick={removeLogo}>Remove logo</button>}
      </div>
    </div>

    <div className={styles.grid}><Input label="Company name" value={form.name} onChange={(event) => update('name', event.target.value)} required /><Input label="Industry" value={form.industry} onChange={(event) => update('industry', event.target.value)} /><Input label="Location" value={form.location} onChange={(event) => update('location', event.target.value)} /><Input label="Website" type="url" value={form.website} onChange={(event) => update('website', event.target.value)} /></div>
    <label className={styles.label} htmlFor="company-description">Description</label><textarea id="company-description" className={styles.textarea} rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} />

    <div className={styles.grid}> {socialFields.map(({ key, label, platform }) => (
      <Input key={key} label={`${label}`} type="url" value={form[key]} placeholder={`https://${platform}.com/your-company`} onChange={(event) => update(key, event.target.value)} />
    ))} </div>

    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Company Profile'}</Button>
    {message && <p className={styles.success}>{message}</p>}{error && <p className={styles.error}>{error}</p>}
  </form>;
}
