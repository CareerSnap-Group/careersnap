import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  const requestedNext = requestUrl.searchParams.get('next');
  const next = getSafeRedirectPath(requestedNext);
  const requestedRole = requestUrl.searchParams.get('role');
  const role = requestedRole === 'employer' || requestedRole === 'job_seeker' ? requestedRole : null;

  if (oauthError) {
    console.error('[CareerSnap OAuth callback]', { error: oauthError });
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'Google sign-in was not completed. Please try again.');
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    console.error('[CareerSnap OAuth callback] missing authorization code', { callback: requestUrl.pathname });
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'Google sign-in did not return an authorization code.');
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[CareerSnap OAuth callback] exchangeCodeForSession failed', {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
    });
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'Authentication callback failed. Please try again.');
    return NextResponse.redirect(loginUrl);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[CareerSnap OAuth callback] session was not available after callback exchange');
    return NextResponse.redirect(new URL('/login?error=Authentication+callback+failed', requestUrl.origin));
  }
  const { data: rawProfile, error: profileError } = await supabase.from('profiles').select('user_type, role_initialized').eq('id', user.id).maybeSingle();
  let profile = rawProfile as { user_type: 'job_seeker' | 'employer'; role_initialized?: boolean } | null;
  if (profileError && profileError.code !== '42703') {
    console.error('[CareerSnap OAuth callback] profile lookup failed', { code: profileError.code, message: profileError.message });
    return NextResponse.redirect(new URL('/login?error=Unable+to+load+account+role', requestUrl.origin));
  }

  if (role && (!profile?.user_type || profile.role_initialized === false)) {
    const { error: roleError } = await supabase.rpc('complete_role_onboarding' as never, { selected_role: role } as never);
    if (roleError) {
      console.error('[CareerSnap OAuth callback] role initialization failed', { code: roleError.code, message: roleError.message });
      return NextResponse.redirect(new URL('/account-setup?error=Choose+your+account+type', requestUrl.origin));
    }
    profile = { user_type: role, role_initialized: true };
  }

  const destination = profile?.role_initialized === false
    ? '/account-setup'
    : profile?.user_type === 'employer'
      ? '/employer/dashboard'
      : profile?.user_type === 'job_seeker'
        ? '/job-seeker/dashboard'
        : '/account-setup';
  return NextResponse.redirect(new URL(next === '/account-setup' ? destination : next, requestUrl.origin));
}