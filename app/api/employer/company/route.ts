import { NextResponse } from 'next/server';
import { getEmployerContext } from '@/lib/auth/server';

export async function PATCH(request: Request) {
  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as unknown as { company_id: string } | null)?.company_id;
  if (!companyId) return NextResponse.json({ error: 'Your employer account has no company.' }, { status: 404 });
  const body = await request.json().catch(() => null) as { name?: string; description?: string; website?: string; location?: string; industry?: string; logo_url?: string } | null;
  if (!body?.name?.trim()) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
  const { error } = await supabase.from('companies').update({ name: body.name.trim(), description: body.description?.trim() || null, website: body.website?.trim() || null, website_url: body.website?.trim() || null, location: body.location?.trim() || null, industry: body.industry?.trim() || null, logo_url: body.logo_url?.trim() || null }).eq('id', companyId);
  if (error) return NextResponse.json({ error: 'We could not update the company profile.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}