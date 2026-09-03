import type { Application, Company, Job, UserProfile } from '@/lib/types';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';

const supabase = () => createClient();

type DatabaseJob = {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  location: string;
  job_type?: string;
  employment_type?: string;
  work_location?: string;
  workplace_type?: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  companies?: { id: string; name: string; description: string | null; industry: string | null; location: string | null } | null;
};

function toJob(row: DatabaseJob): Job {
  const companyRow = row.companies;
  const company: Company = {
    id: companyRow?.id || row.company_id,
    name: companyRow?.name || 'CareerSnap Company',
    description: companyRow?.description || '',
    industry: companyRow?.industry || 'Various industries',
    size: 'medium',
    location: companyRow?.location || row.location,
  };

  return {
    id: row.id,
    title: row.title,
    company,
    location: row.location,
    jobType: (row.employment_type || row.job_type || 'full-time') as Job['jobType'],
    experienceLevel: 'mid',
    workLocation: ((row.workplace_type || row.work_location || 'onsite') === 'onsite' ? 'on-site' : row.workplace_type || row.work_location || 'remote') as Job['workLocation'],
    salary: row.salary_min !== null && row.salary_max !== null
      ? { min: row.salary_min, max: row.salary_max, currency: row.salary_currency || 'ZAR' }
      : undefined,
    description: row.description,
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    benefits: row.benefits || [],
    postedDate: new Date(row.published_at || row.created_at),
    tags: [],
  };
}

export async function fetchPublishedJobs(): Promise<Job[] | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase().from('jobs').select('*, companies (id, name, description, industry, location)').eq('status', 'published').order('created_at', { ascending: false });
  if (error || !data) return null;
  return (data as unknown as DatabaseJob[]).map(toJob);
}

export async function fetchSavedJobIds(userId: string): Promise<string[] | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase().from('saved_jobs').select('job_id').eq('user_id', userId);
  if (error || !data) return null;
  return data.map((row) => row.job_id);
}

export async function saveJob(userId: string, jobId: string) {
  if (!isSupabaseConfigured()) return;
  await supabase().from('saved_jobs').upsert({ user_id: userId, job_id: jobId });
}

export async function unsaveJob(userId: string, jobId: string) {
  if (!isSupabaseConfigured()) return;
  await supabase().from('saved_jobs').delete().eq('user_id', userId).eq('job_id', jobId);
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase().from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  const fullName = data.full_name || 'CareerSnap Member';
  const [firstName, ...lastNameParts] = fullName.split(' ');
  return {
    id: data.id,
    firstName,
    lastName: lastNameParts.join(' '),
    email: data.email || '',
    phone: data.phone || undefined,
    location: data.location || '',
    headline: data.headline || '',
    summary: data.bio || '',
    skills: [],
    experience: [],
    education: [],
    profileCompletion: 20,
  };
}

export type SupabaseApplication = Pick<Application, 'id' | 'jobId' | 'status'> & { appliedDate: Date; nextStep?: string };

export async function fetchApplications(userId: string): Promise<SupabaseApplication[] | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase().from('applications').select('id, job_id, status, created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    status: row.status as SupabaseApplication['status'],
    appliedDate: new Date(row.created_at),
  }));
}
