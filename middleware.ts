import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from '@/lib/supabase/database.types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

const protectedPaths = ['/saved-jobs', '/applications', '/profile', '/employers/post-job', '/job-seeker', '/employer'];
const employerPaths = ['/employer', '/employers/post-job'];
const seekerPaths = ['/job-seeker', '/saved-jobs', '/applications', '/profile'];

function dashboardForRole(role: 'job_seeker' | 'employer') {
  return role === 'employer' ? '/employer/dashboard' : '/job-seeker/dashboard';
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));

  if (!isSupabaseConfigured()) {
    if (isProtectedPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (isProtectedPath && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', getSafeRedirectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    let { data: rawProfile, error: profileError } = await supabase.from('profiles').select('user_type, role_initialized').eq('id', user.id).maybeSingle();
    if (profileError?.code === '42703') {
      const legacyProfile = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
      rawProfile = legacyProfile.data ? { ...legacyProfile.data, role_initialized: true } : null;
      profileError = legacyProfile.error;
    }
    if (profileError) {
      if (request.nextUrl.pathname === '/login') return response;
      const errorUrl = new URL('/login', request.url);
      errorUrl.searchParams.set('error', 'Unable to load account role');
      return NextResponse.redirect(errorUrl);
    }
    const profile = rawProfile as unknown as { user_type: 'job_seeker' | 'employer' | null; role_initialized?: boolean } | null;
    const pathname = request.nextUrl.pathname;
    const isEmployerRoute = employerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    const isSeekerRoute = seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if ((!profile?.user_type || profile.role_initialized === false) && pathname !== '/account-setup') {
      return NextResponse.redirect(new URL('/account-setup', request.url));
    }
    if (pathname === '/account-setup' && profile?.user_type && profile.role_initialized !== false) {
      return NextResponse.redirect(new URL(dashboardForRole(profile.user_type), request.url));
    }
    if (isEmployerRoute && profile?.user_type !== 'employer') {
      return NextResponse.redirect(new URL(profile?.user_type === 'job_seeker' ? '/job-seeker/dashboard' : '/account-setup', request.url));
    }
    if (isSeekerRoute && profile?.user_type !== 'job_seeker') {
      return NextResponse.redirect(new URL(profile?.user_type === 'employer' ? '/employer/dashboard' : '/account-setup', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
