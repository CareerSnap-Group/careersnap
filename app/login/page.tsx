'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './auth.module.css';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getSafeRedirectPath } from '@/lib/auth/redirect';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [nextPath, setNextPath] = useState('/account-setup');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    setNextPath(getSafeRedirectPath(next));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Connect your Supabase project by filling in .env.local first.');
      return;
    }

    setLoading(true);
    try {
      const client = createClient();
      const { error: authError } = await client.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: profile } = await client.from('profiles').select('user_type').eq('id', (await client.auth.getUser()).data.user?.id || '').maybeSingle();
      const dashboard = profile?.user_type === 'employer' ? '/employer/dashboard' : profile?.user_type === 'job_seeker' ? '/job-seeker/dashboard' : '/account-setup';
      router.push(nextPath === '/account-setup' ? dashboard : nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!isSupabaseConfigured()) {
      setError('Connect your Supabase project by filling in .env.local first.');
      return;
    }

    setLoading(true);
    const { error: authError } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>{nextPath === '/saved-jobs' ? 'Sign in to view your saved jobs.' : nextPath === '/applications' ? 'Sign in to view your applications.' : nextPath === '/profile' ? 'Sign in to access your CareerSnap account.' : 'Sign in to your CareerSnap account'}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <Input
              type="email"
              placeholder="Email address"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <Input
              type="password"
              placeholder="Password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <div className={styles.rememberMe}>
              <label>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" className={styles.submitButton} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <div className={styles.socialButtons}>
            <Button variant="outline" fullWidth onClick={handleGoogleSignIn} disabled={loading}>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>
            <Button variant="outline" fullWidth>
              Continue with LinkedIn
            </Button>
          </div>

          <div className={styles.signup}>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className={styles.signupLink}>
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
