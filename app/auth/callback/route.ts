import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  const requestedNext = requestUrl.searchParams.get('next');
  const next = getSafeRedirectPath(requestedNext);

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
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  const destination = profile?.user_type === 'employer' ? '/employer/dashboard' : profile?.user_type === 'job_seeker' ? '/job-seeker/dashboard' : '/account-setup';
  return NextResponse.redirect(new URL(next === '/account-setup' ? destination : next, requestUrl.origin));
}