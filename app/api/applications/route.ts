import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ApplicationPayload = {
  jobId?: string;
  resumeId?: string | null;
  coverLetter?: string;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in before applying.' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: 'We could not verify your account role.' }, { status: 500 });
  if (profile?.user_type !== 'job_seeker') return NextResponse.json({ error: 'Only Job Seekers can apply for jobs.' }, { status: 403 });

  const body = await request.json() as ApplicationPayload;
  if (!body.jobId) return NextResponse.json({ error: 'A job is required to submit an application.' }, { status: 400 });

  const { data: job, error: jobError } = await supabase.from('jobs').select('id, expires_at').eq('id', body.jobId).eq('status', 'published').maybeSingle();
  if (jobError || !job || (job.expires_at && new Date(job.expires_at) <= new Date())) return NextResponse.json({ error: 'This job is no longer available for applications.' }, { status: 400 });

  if (body.resumeId) {
    const { data: resume, error: resumeError } = await supabase.from('resumes').select('id').eq('id', body.resumeId).eq('user_id', user.id).maybeSingle();
    if (resumeError || !resume) return NextResponse.json({ error: 'The selected resume is not available.' }, { status: 400 });
  }

  const { error: insertError } = await supabase.from('applications').insert({
    job_id: body.jobId,
    applicant_id: user.id,
    user_id: user.id,
    resume_id: body.resumeId || null,
    cover_letter: body.coverLetter?.trim() || null,
    notes: null,
    status: 'submitted',
  });

  if (insertError) {
    if (insertError.code === '23505') return NextResponse.json({ error: 'You have already applied for this job.' }, { status: 409 });
    return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}