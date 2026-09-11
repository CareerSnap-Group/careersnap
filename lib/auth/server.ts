import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

export type AccountRole = 'job_seeker' | 'employer';

export async function requireRole(role: AccountRole) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let { data: rawProfile, error: profileError } = await supabase.from('profiles').select('user_type, role_initialized').eq('id', user.id).maybeSingle();
  if (profileError?.code === '42703') {
    const legacyProfile = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
    rawProfile = legacyProfile.data ? { ...legacyProfile.data, role_initialized: true } : null;
    profileError = legacyProfile.error;
  }
  const profile = rawProfile as unknown as { user_type: AccountRole | null; role_initialized?: boolean } | null;
  if (profileError) redirect('/login?error=Unable+to+load+account+role');
  if (!profile) redirect('/account-setup');
  if (profile?.role_initialized === false) redirect('/account-setup');
  if (!profile?.user_type) redirect('/account-setup');
  if (profile.user_type !== role) redirect(profile.user_type === 'employer' ? '/employer/dashboard' : '/job-seeker/dashboard');
  return { supabase, user, profile: profile as Database['public']['Tables']['profiles']['Row'] };
}

export async function getEmployerContext() {
  const context = await requireRole('employer');
  const { data: membership } = await context.supabase
    .from('employer_users')
    .select('company_id, role, companies(*)')
    .eq('user_id', context.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return { ...context, membership };
}