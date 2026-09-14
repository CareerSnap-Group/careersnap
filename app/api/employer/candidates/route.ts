import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to search candidates.' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const pageSize = Math.min(Math.max(Number(params.get('page_size') || 25), 1), 100);
  const pageNumber = Math.max(Number(params.get('page') || 1), 1);
  const { data, error } = await supabase.rpc('search_discoverable_candidates' as never, {
    search_keyword: params.get('keyword') || null,
    search_location: params.get('location') || null,
    search_skill: params.get('skill') || null,
    search_job_title: params.get('job_title') || null,
    search_employment_type: params.get('employment_type') || null,
    search_availability: params.get('availability') || null,
    require_cv: params.get('has_cv') === null ? null : params.get('has_cv') === 'true',
    page_size: pageSize,
    page_number: pageNumber,
  } as never);
  if (error) return NextResponse.json({ error: 'We could not search candidates.' }, { status: 403 });
  return NextResponse.json({ candidates: data || [], page: pageNumber, page_size: pageSize });
}