import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const viewerKey = request.headers.get('x-careersnap-viewer') || '';
  if (!/^[0-9a-f-]{16,64}$/i.test(viewerKey)) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await createClient().rpc('record_job_view', { target_job_id: params.id, target_viewer_key: viewerKey });
  if (error) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}