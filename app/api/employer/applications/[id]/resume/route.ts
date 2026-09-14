import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to access this resume.' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profileError || profile?.user_type !== 'employer') return NextResponse.json({ error: 'You do not have access to this resume.' }, { status: 403 });

  const { data: rawApplication, error: applicationError } = await supabase
    .from('applications')
    .select('id, applicant_id, user_id, resume_id, jobs!inner(company_id)')
    .eq('id', params.id)
    .maybeSingle();
  const application = rawApplication as unknown as { id: string; applicant_id: string; user_id: string; resume_id: string | null; jobs: { company_id: string } | { company_id: string }[] | null } | null;
  if (applicationError || !application) return NextResponse.json({ error: 'Application or resume not found.' }, { status: 404 });

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
  if (!job?.company_id || application.applicant_id !== application.user_id || !application.resume_id) return NextResponse.json({ error: 'Application or resume not found.' }, { status: 404 });

  const { data: membership, error: accessError } = await supabase.from('employer_users').select('company_id').eq('company_id', job.company_id).eq('user_id', user.id).in('role', ['owner', 'admin']).maybeSingle();
  if (accessError || !membership) return NextResponse.json({ error: 'You do not have access to this resume.' }, { status: 403 });

  const { data: resume, error: resumeError } = await supabase.from('resumes').select('storage_path').eq('id', application.resume_id).eq('user_id', application.applicant_id).maybeSingle();
  if (resumeError || !resume) return NextResponse.json({ error: 'Application or resume not found.' }, { status: 404 });

  const { data: signedFile, error: signedUrlError } = await supabase.storage.from('resumes').createSignedUrl(resume.storage_path, 60 * 5);
  if (signedUrlError || !signedFile?.signedUrl) return NextResponse.json({ error: 'We could not open this resume.' }, { status: 400 });
  return NextResponse.json({ url: signedFile.signedUrl });
}