import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getOwnedResume(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, resume: null };
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profile?.user_type !== 'job_seeker') return { supabase, user: null, resume: null };
  const { data: resume } = await supabase.from('resumes').select('id, file_name, storage_path, is_primary, is_default, created_at').eq('id', id).eq('user_id', user.id).maybeSingle();
  return { supabase, user, resume };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, resume } = await getOwnedResume(params.id);
  if (!user) return NextResponse.json({ error: 'Please sign in to view your CV.' }, { status: 401 });
  if (!resume) return NextResponse.json({ error: 'CV not found.' }, { status: 404 });
  const { data, error } = await supabase.storage.from('resumes').createSignedUrl(resume.storage_path, 60 * 5);
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'We could not open your CV.' }, { status: 400 });
  return NextResponse.json({ url: data.signedUrl });
}

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, resume } = await getOwnedResume(params.id);
  if (!user) return NextResponse.json({ error: 'Please sign in to manage your CVs.' }, { status: 401 });
  if (!resume) return NextResponse.json({ error: 'CV not found.' }, { status: 404 });
  const { error: clearError } = await supabase.from('resumes').update({ is_primary: false, is_default: false }).eq('user_id', user.id);
  if (clearError) return NextResponse.json({ error: 'We could not update your primary CV.' }, { status: 400 });
  const { error } = await supabase.from('resumes').update({ is_primary: true, is_default: true }).eq('id', resume.id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'We could not update your primary CV.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, resume } = await getOwnedResume(params.id);
  if (!user) return NextResponse.json({ error: 'Please sign in to manage your CVs.' }, { status: 401 });
  if (!resume) return NextResponse.json({ error: 'CV not found.' }, { status: 404 });
  const { error: storageError } = await supabase.storage.from('resumes').remove([resume.storage_path]);
  if (storageError) return NextResponse.json({ error: 'We could not remove the CV file.' }, { status: 400 });
  const { error: deleteError } = await supabase.from('resumes').delete().eq('id', resume.id).eq('user_id', user.id);
  if (deleteError) return NextResponse.json({ error: 'The file was removed, but its record could not be deleted.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}