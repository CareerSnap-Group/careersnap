import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type JobPayload = {
  jobTitle?: string;
  company?: string;
  location?: string;
  workLocation?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: string;
  salaryMax?: string;
  currency?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  status?: string;
};

function listValue(value: string | undefined) {
  return (value || '').split('\n').map((item) => item.trim()).filter(Boolean);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to manage jobs.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profile?.user_type !== 'employer') return NextResponse.json({ error: "You don't have access to employer tools." }, { status: 403 });

  const body = await request.json() as JobPayload;
  if (body.status && !['draft', 'published', 'closed'].includes(body.status)) return NextResponse.json({ error: 'That job status is not supported.' }, { status: 400 });

  const { data: existingJob, error: existingJobError } = await supabase.from('jobs').select('title, description, responsibilities, requirements, benefits, location, work_location, job_type, experience_level, salary_min, salary_max, salary_currency, status').eq('id', params.id).maybeSingle();
  if (existingJobError || !existingJob) return NextResponse.json({ error: 'We could not find that job.' }, { status: 404 });
  if (!body.status && (!body.jobTitle || !body.location || !body.description || !body.requirements)) return NextResponse.json({ error: 'Please complete the required job details.' }, { status: 400 });
  const nextStatus = body.status || existingJob.status;
  if (nextStatus === 'published' && existingJob.status !== 'published') {
    const { data: canPublish, error: limitError } = await supabase.rpc('can_create_job');
    if (limitError || !canPublish) return NextResponse.json({ error: 'Your current plan has reached its active job limit.' }, { status: 400 });
  }

  const { error } = await supabase.from('jobs').update({
    title: body.jobTitle || existingJob.title,
    description: body.description || existingJob.description,
    responsibilities: body.responsibilities === undefined ? existingJob.responsibilities : listValue(body.responsibilities),
    requirements: body.requirements === undefined ? existingJob.requirements : listValue(body.requirements),
    benefits: body.benefits === undefined ? existingJob.benefits : listValue(body.benefits),
    location: body.location || existingJob.location,
    work_location: body.workLocation || existingJob.work_location,
    job_type: body.jobType || existingJob.job_type,
    experience_level: body.experienceLevel || existingJob.experience_level,
    salary_min: body.salaryMin === undefined ? existingJob.salary_min : body.salaryMin ? Number(body.salaryMin) : null,
    salary_max: body.salaryMax === undefined ? existingJob.salary_max : body.salaryMax ? Number(body.salaryMax) : null,
    salary_currency: body.currency || existingJob.salary_currency,
    status: nextStatus,
    published_at: nextStatus === 'published' ? new Date().toISOString() : null,
  }).eq('id', params.id);
  if (error) return NextResponse.json({ error: 'We could not update this job.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to manage jobs.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profile?.user_type !== 'employer') return NextResponse.json({ error: "You don't have access to employer tools." }, { status: 403 });
  const { error } = await supabase.from('jobs').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'We could not delete this job.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}