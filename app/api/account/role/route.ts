import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to complete account setup.' }, { status: 401 });
  const body = await request.json() as { role?: string };
  if (body.role !== 'job_seeker' && body.role !== 'employer') return NextResponse.json({ error: 'Choose a valid account type.' }, { status: 400 });
  const { data, error } = await supabase.rpc('complete_role_onboarding' as never, { selected_role: body.role } as never);
  if (!error) return NextResponse.json({ role: data });

  // Older environments may not have the onboarding migration yet. Keep the
  // operation scoped to the authenticated profile until that migration lands.
  if (error.code !== 'PGRST202' && error.code !== '42883') {
    console.error('[CareerSnap role onboarding] RPC failed', { code: error.code, message: error.message });
    return NextResponse.json({ error: 'We could not complete account setup.' }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profileError) {
    console.error('[CareerSnap role onboarding] profile lookup failed', { code: profileError.code, message: profileError.message });
    return NextResponse.json({ error: 'We could not complete account setup.' }, { status: 500 });
  }
  if (profile?.user_type) {
    if (profile.user_type === body.role) return NextResponse.json({ role: profile.user_type });
    return NextResponse.json({ error: 'Your account role is already configured. Apply the role onboarding migration before assigning a new role.' }, { status: 409 });
  }
  const { error: updateError } = await supabase.from('profiles').update({ user_type: body.role }).eq('id', user.id).is('user_type', null).select('user_type').maybeSingle();
  if (updateError) {
    console.error('[CareerSnap role onboarding] profile update failed', { code: updateError.code, message: updateError.message });
    return NextResponse.json({ error: 'We could not complete account setup.' }, { status: 500 });
  }
  return NextResponse.json({ role: body.role });
}