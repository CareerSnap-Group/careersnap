import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedNext = requestUrl.searchParams.get('next');
  const next = getSafeRedirectPath(requestedNext);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'Authentication callback failed. Please try again.');
      return NextResponse.redirect(loginUrl);
    }
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', requestUrl.origin));
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  const destination = profile?.user_type === 'employer' ? '/employer/dashboard' : profile?.user_type === 'job_seeker' ? '/job-seeker/dashboard' : '/account-setup';
  return NextResponse.redirect(new URL(next === '/account-setup' ? destination : next, requestUrl.origin));
}