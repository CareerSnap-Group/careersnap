import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to rate a company.' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profileError || profile?.user_type !== 'job_seeker') {
    return NextResponse.json({ error: 'Only Job Seekers can rate companies.' }, { status: 403 });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
  }

  const { data: company, error: companyError } = await supabase.from('companies').select('id').eq('id', params.id).maybeSingle();
  if (companyError || !company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

  const body = await request.json().catch(() => null) as { rating?: unknown } | null;
  const rating = body?.rating;
  if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5) {
    return NextResponse.json({ error: 'Rating must be an integer from 1 to 5.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('company_ratings')
    .upsert({ company_id: company.id, user_id: user.id, rating: Number(rating) }, { onConflict: 'company_id,user_id' })
    .select('rating')
    .single();

  if (error) return NextResponse.json({ error: 'We could not save your rating.' }, { status: 400 });
  return NextResponse.json({ rating: data.rating });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  void request;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to rate a company.' }, { status: 401 });

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
  }

  const { data: company, error: companyError } = await supabase.from('companies').select('id').eq('id', params.id).maybeSingle();
  if (companyError || !company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

  const { error } = await supabase
    .from('company_ratings')
    .delete()
    .eq('company_id', company.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'We could not remove your rating.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}