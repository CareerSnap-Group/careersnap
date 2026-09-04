import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

export type AccountRole = 'job_seeker' | 'employer';

export async function requireRole(role: AccountRole) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rawProfile, error: profileError } = await supabase.from('profiles').select('user_type, role_initialized').eq('id', user.id).maybeSingle();
  const profile = rawProfile as unknown as { user_type: AccountRole; role_initialized?: boolean } | null;
  const legacyProfile = profileError?.code === '42703';
  if (!profile && !legacyProfile) redirect('/account-setup');
  if (profile?.role_initialized === false) redirect('/account-setup');
  if (profile?.user_type !== role) redirect(role === 'employer' ? '/job-seeker/dashboard' : '/employer/dashboard');
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