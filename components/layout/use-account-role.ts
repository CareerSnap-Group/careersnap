'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type AccountRole = 'job_seeker' | 'employer';
export type AccountState = 'loading' | 'logged-out' | AccountRole;

export function useAccountRole() {
  const [authState, setAuthState] = useState<AccountState>('loading');
  const [displayName, setDisplayName] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthState('logged-out');
      setDisplayName('');
      setProfilePhotoUrl(null);
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    const applyUser = async (user: { id: string; email?: string | null; user_metadata?: { full_name?: string | null; name?: string | null } } | null | undefined) => {
      if (!user) {
        if (isMounted) {
          setAuthState('logged-out');
          setDisplayName('');
          setProfilePhotoUrl(null);
        }
        return;
      }

      if (isMounted) {
        setAuthState('loading');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name, profile_photo_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      const role = profile?.user_type as AccountRole | null | undefined;
      const nextDisplayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'CareerSnap Member';
      const nextPhotoUrl = profile?.profile_photo_url || null;

      setDisplayName(nextDisplayName);
      setProfilePhotoUrl(nextPhotoUrl);

      if (role === 'job_seeker' || role === 'employer') {
        setAuthState(role);
        return;
      }

      setAuthState('loading');
    };

    supabase.auth.getUser().then(({ data: { user } }) => applyUser(user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const role = authState === 'loading' || authState === 'logged-out' ? null : authState;
  const signedIn = authState === 'job_seeker' || authState === 'employer';

  return {
    authState,
    role,
    signedIn,
    isLoading: authState === 'loading',
    isLoggedOut: authState === 'logged-out',
    displayName,
    profilePhotoUrl,
  };
}
