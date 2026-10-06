'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { fetchSavedJobIds } from '@/lib/supabase/data';

type AuthState = {
  userId: string | null;
  ready: boolean;
  error: boolean;
};

export function useSavedJobIds() {
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    ready: !isSupabaseConfigured(),
    error: false,
  });
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => new Set());
  const [savedStateReady, setSavedStateReady] = useState(!isSupabaseConfigured());
  const [savedStateError, setSavedStateError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthState({ userId: null, ready: true, error: false });
      return;
    }

    let active = true;
    const supabase = createClient();
    const updateUser = (userId: string | null) => {
      if (!active) return;
      setAuthState((current) => current.ready && current.userId === userId && !current.error
        ? current
        : { userId, ready: true, error: false });
    };

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        if (error.name === 'AuthSessionMissingError') {
          updateUser(null);
          return;
        }
        setAuthState({ userId: null, ready: true, error: true });
        return;
      }
      updateUser(data.user?.id ?? null);
    }).catch(() => {
      if (active) setAuthState({ userId: null, ready: true, error: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUser(session?.user.id ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!authState.ready) {
      setSavedStateReady(false);
      setSavedStateError(false);
      return () => { active = false; };
    }

    if (authState.error) {
      setSavedStateReady(false);
      setSavedStateError(true);
      return () => { active = false; };
    }

    if (!authState.userId) {
      setSavedJobIds(new Set());
      setSavedStateReady(true);
      setSavedStateError(false);
      return () => { active = false; };
    }

    setSavedStateReady(false);
    setSavedStateError(false);
    fetchSavedJobIds(authState.userId).then((ids) => {
      if (!active) return;
      if (ids === null) {
        setSavedStateError(true);
        return;
      }
      setSavedJobIds(new Set(ids));
      setSavedStateReady(true);
    }).catch(() => {
      if (active) setSavedStateError(true);
    });

    return () => { active = false; };
  }, [authState]);

  return { savedJobIds, savedStateReady, savedStateError };
}
