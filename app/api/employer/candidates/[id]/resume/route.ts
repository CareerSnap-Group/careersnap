import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to access this resume.' }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Resume access is not configured.' }, { status: 503 });
  const requestedResumeId = new URL(request.url).searchParams.get('resume_id');
  const { data: canDiscover, error: discoveryError } = await supabase.rpc('can_discover_candidates' as never);
  if (discoveryError || !canDiscover) return NextResponse.json({ error: 'Candidate resume not found.' }, { status: 404 });
  const { data: candidate, error: candidateError } = await admin.from('profiles').select('id').eq('id', params.id).eq('user_type', 'job_seeker').eq('allow_employer_discovery', true).maybeSingle();
  if (candidateError || !candidate) return NextResponse.json({ error: 'Candidate resume not found.' }, { status: 404 });
  const resumeQuery = admin.from('resumes').select('storage_path').eq('user_id', candidate.id);
  const { data: resume, error: resumeError } = requestedResumeId
    ? await resumeQuery.eq('id', requestedResumeId).maybeSingle()
    : await resumeQuery.order('is_primary', { ascending: false }).order('is_default', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (resumeError || !resume) return NextResponse.json({ error: 'Candidate resume not found.' }, { status: 404 });
  const storagePath = resume.storage_path;
  const { data: signedFile, error: signedUrlError } = await admin.storage.from('resumes').createSignedUrl(storagePath as unknown as string, 60 * 5);
  if (signedUrlError || !signedFile?.signedUrl) return NextResponse.json({ error: 'We could not open this resume.' }, { status: 400 });
  return NextResponse.json({ url: signedFile.signedUrl });
}