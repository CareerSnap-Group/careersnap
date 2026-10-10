import type { ReactNode } from 'react';
import { AuthenticatedAppShell } from '@/components/layout/authenticated-app-shell';
import { requireRole } from '@/lib/auth/server';

export default async function JobSeekerLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await requireRole('job_seeker');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, first_name, profile_photo_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  const displayName = profile?.full_name || profile?.first_name || user.email?.split('@')[0] || 'CareerSnap Member';

  return (
    <AuthenticatedAppShell role="job_seeker" displayName={displayName} avatarUrl={profile?.profile_photo_url}>
      {children}
    </AuthenticatedAppShell>
  );
}
