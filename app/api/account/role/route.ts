import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to complete account setup.' }, { status: 401 });
  const body = await request.json() as { role?: string };
  if (body.role !== 'job_seeker' && body.role !== 'employer') return NextResponse.json({ error: 'Choose a valid account type.' }, { status: 400 });
  const { data, error } = await supabase.rpc('complete_role_onboarding' as never, { selected_role: body.role } as never);
  if (error) return NextResponse.json({ error: 'Your account role is already configured.' }, { status: 409 });
  return NextResponse.json({ role: data });
}