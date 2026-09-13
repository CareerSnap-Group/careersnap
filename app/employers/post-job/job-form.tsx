'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './post-job.module.css';

export type JobFormData = {
  jobTitle: string;
  company: string;
  location: string;
  workLocation: string;
  jobType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
};

const emptyForm: JobFormData = {
  jobTitle: '', company: '', location: '', workLocation: 'hybrid', jobType: 'full-time', experienceLevel: 'mid',
  salaryMin: '', salaryMax: '', currency: 'ZAR', description: '', responsibilities: '', requirements: '', benefits: '',
};

type JobFormProps = {
  mode: 'create' | 'edit';
  jobId?: string;
  initialData?: Partial<JobFormData>;
  initialStatus?: string;
};

export function JobForm({ mode, jobId, initialData, initialStatus = 'draft' }: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({ ...emptyForm, ...initialData });
  const [status, setStatus] = useState(initialStatus);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const endpoint = mode === 'edit' ? `/api/employer/jobs/${jobId}` : '/api/employer/jobs';
    const response = await fetch(endpoint, { method: mode === 'edit' ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, status }) });
    const result = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) { setError(result.error || 'We could not save this job.'); return; }
    if (mode === 'edit') { window.location.href = '/employer/jobs'; return; }
    setSubmitted(true);
  };

  if (submitted) return <div className={styles.successCard}><div className={styles.successIcon}><Icon name="check" /></div><h2 className={styles.successTitle}>Job saved successfully</h2><p className={styles.successText}>Your job is now {status === 'published' ? 'published and visible to job seekers.' : 'saved as a draft.'}</p><div className={styles.successActions}><Link href="/employer/jobs"><Button variant="outline">Manage Jobs</Button></Link><Link href="/employers/post-job"><Button>Post Another Job</Button></Link></div></div>;

  return <form onSubmit={handleSubmit} className={styles.form}>
    {error && <div className={styles.error}>{error}</div>}
    <fieldset className={styles.fieldset}><legend className={styles.fieldsetTitle}>Job Information</legend><Input type="text" name="jobTitle" label="Job Title" placeholder="e.g., Senior Frontend Developer" value={formData.jobTitle} onChange={handleChange} required fullWidth /><Input type="text" name="company" label="Company Name" placeholder="Your company name" value={formData.company} onChange={handleChange} required fullWidth /><Input type="text" name="location" label="Location" placeholder="e.g., Johannesburg, South Africa" value={formData.location} onChange={handleChange} required fullWidth /><div className={styles.twoCol}><div><label className={styles.label}>Work Location</label><select name="workLocation" value={formData.workLocation} onChange={handleChange} className={styles.select}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on-site">On-site</option></select></div><div><label className={styles.label}>Job Type</label><select name="jobType" value={formData.jobType} onChange={handleChange} className={styles.select}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="temporary">Temporary</option><option value="internship">Internship</option></select></div></div><div><label className={styles.label}>Experience Level</label><select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className={styles.select}><option value="entry">Entry Level</option><option value="mid">Mid Level</option><option value="senior">Senior Level</option><option value="executive">Executive</option></select></div></fieldset>
    <fieldset className={styles.fieldset}><legend className={styles.fieldsetTitle}>Salary Range (Optional)</legend><div className={styles.twoCol}><Input type="number" name="salaryMin" label="Minimum Salary" placeholder="e.g., 35000" value={formData.salaryMin} onChange={handleChange} fullWidth /><Input type="number" name="salaryMax" label="Maximum Salary" placeholder="e.g., 50000" value={formData.salaryMax} onChange={handleChange} fullWidth /></div><div><label className={styles.label}>Currency</label><select name="currency" value={formData.currency} onChange={handleChange} className={styles.select}><option value="ZAR">ZAR (South African Rand)</option><option value="USD">USD (US Dollar)</option><option value="EUR">EUR (Euro)</option><option value="GBP">GBP (British Pound)</option></select></div></fieldset>
    <fieldset className={styles.fieldset}><legend className={styles.fieldsetTitle}>Job Description</legend><div><label className={styles.label}>Job Description</label><textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the role and what you're looking for..." className={styles.textarea} rows={5} required /></div><div><label className={styles.label}>Responsibilities</label><textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} placeholder="List key responsibilities (one per line)" className={styles.textarea} rows={5} /></div><div><label className={styles.label}>Requirements</label><textarea name="requirements" value={formData.requirements} onChange={handleChange} placeholder="List key requirements and qualifications (one per line)" className={styles.textarea} rows={5} required /></div><div><label className={styles.label}>Benefits (Optional)</label><textarea name="benefits" value={formData.benefits} onChange={handleChange} placeholder="List benefits (one per line)" className={styles.textarea} rows={3} /></div></fieldset>
    <fieldset className={styles.fieldset}><legend className={styles.fieldsetTitle}>Publishing</legend><div><label className={styles.label}>Status</label><select name="status" value={status} onChange={(event) => setStatus(event.target.value)} className={styles.select}><option value="draft">Draft</option><option value="published">Published</option>{mode === 'edit' && <option value="closed">Closed</option>}</select></div></fieldset>
    <div className={styles.actions}><Button type="submit" size="lg" disabled={saving}>{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Job'}</Button><Link href={mode === 'edit' ? '/employer/jobs' : '/employer/dashboard'}><Button variant="outline" size="lg">Cancel</Button></Link></div>
  </form>;
}