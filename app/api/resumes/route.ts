import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const allowedExtensions = new Set(['pdf', 'doc', 'docx']);

function isAllowedFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return Boolean(extension && allowedExtensions.has(extension) && allowedTypes.has(file.type));
}

async function getAuthenticatedClient() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isJobSeeker: false };
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  return { supabase, user, isJobSeeker: profile?.user_type === 'job_seeker' };
}

export async function GET() {
  const { supabase, user, isJobSeeker } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: 'Please sign in to manage your CVs.' }, { status: 401 });
  if (!isJobSeeker) return NextResponse.json({ error: 'Only Job Seekers can manage CVs.' }, { status: 403 });
  const { data, error } = await supabase.from('resumes').select('id, file_name, is_primary, is_default, created_at').eq('user_id', user.id).order('is_primary', { ascending: false }).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'We could not load your CVs.' }, { status: 500 });
  return NextResponse.json({ resumes: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user, isJobSeeker } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: 'Please sign in to upload a CV.' }, { status: 401 });
  if (!isJobSeeker) return NextResponse.json({ error: 'Only Job Seekers can upload CVs.' }, { status: 403 });
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Choose a CV file to upload.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Your CV must be 5MB or smaller.' }, { status: 400 });
  if (!isAllowedFile(file)) return NextResponse.json({ error: 'Upload a PDF, DOC, or DOCX file.' }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from('resumes').upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'We could not upload your CV.' }, { status: 400 });

  const { count } = await supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const isPrimary = (count || 0) === 0;
  if (isPrimary) await supabase.from('resumes').update({ is_primary: false, is_default: false }).eq('user_id', user.id);
  const { data: resume, error: insertError } = await supabase.from('resumes').insert({ user_id: user.id, file_name: file.name, storage_path: storagePath, file_path: storagePath, file_url: null, is_primary: isPrimary, is_default: isPrimary }).select('id, file_name, is_primary, is_default, created_at').single();
  if (insertError || !resume) {
    await supabase.storage.from('resumes').remove([storagePath]);
    return NextResponse.json({ error: 'Your CV uploaded but could not be saved. Please try again.' }, { status: 400 });
  }
  return NextResponse.json({ resume }, { status: 201 });
}