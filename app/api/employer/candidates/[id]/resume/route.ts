import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to access this resume.' }, { status: 401 });
  const requestedResumeId = new URL(request.url).searchParams.get('resume_id');
  const { data: storagePath, error: pathError } = await supabase.rpc('get_discoverable_resume_path' as never, { candidate_id: params.id, requested_resume_id: requestedResumeId || null } as never);
  if (pathError || !storagePath) return NextResponse.json({ error: 'Candidate resume not found.' }, { status: 404 });
  const { data: signedFile, error: signedUrlError } = await supabase.storage.from('resumes').createSignedUrl(storagePath as unknown as string, 60 * 5);
  if (signedUrlError || !signedFile?.signedUrl) return NextResponse.json({ error: 'We could not open this resume.' }, { status: 400 });
  return NextResponse.json({ url: signedFile.signedUrl });
}