import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to view candidates.' }, { status: 401 });
  const { data: rawData, error } = await supabase.rpc('get_discoverable_candidate' as never, { candidate_id: params.id } as never);
  const data = rawData as unknown as Array<Record<string, unknown>> | null;
  if (error || !data || data.length === 0) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
  return NextResponse.json({ candidate: data[0] });
}