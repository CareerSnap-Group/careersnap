import type { ReactNode } from 'react';
import { AuthenticatedAppShell } from '@/components/layout/authenticated-app-shell';
import { getEmployerContext } from '@/lib/auth/server';

type EmployerCompany = { name: string | null; logo_url: string | null };

export default async function EmployerLayout({ children }: { children: ReactNode }) {
  const { supabase, user, membership } = await getEmployerContext();
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('full_name, profile_photo_url')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const companyRelation = (membership as unknown as { companies: EmployerCompany | EmployerCompany[] | null } | null)?.companies;
  const company = Array.isArray(companyRelation) ? companyRelation[0] : companyRelation;
  const profileName = profile?.full_name || user.email?.split('@')[0] || 'Employer';
  const displayName = company?.name || profileName;

  return (
    <AuthenticatedAppShell
      role="employer"
      displayName={displayName}
      avatarUrl={company?.logo_url || profile?.profile_photo_url}
      monochrome
    >
      {children}
    </AuthenticatedAppShell>
  );
}
