'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './auth.module.css';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAuthRedirectUrl } from '@/lib/auth/url';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [userType, setUserType] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Connect your Supabase project by filling in .env.local first.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl('/auth/callback'),
          data: { full_name: `${formData.firstName} ${formData.lastName}`.trim(), user_type: userType },
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) router.push(userType === 'employer' ? '/employer/dashboard' : '/job-seeker/dashboard');
      else setError('Account created. Check your email to verify your account before signing in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    if (!isSupabaseConfigured()) {
      setError('Connect your Supabase project by filling in .env.local first.');
      return;
    }

    setLoading(true);
    const { error: authError } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${getAuthRedirectUrl('/auth/callback')}?next=/account-setup` },
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
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join CareerSnap to start your job search</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.nameRow}>
              <Input
                type="text"
                name="firstName"
                placeholder="First name"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
              />
              <Input
                type="text"
                name="lastName"
                placeholder="Last name"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
              />
            </div>

            <Input
              type="email"
              name="email"
              placeholder="Email address"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
            />

            <fieldset className={styles.accountType}>
              <legend className={styles.accountTypeLegend}>What are you here to do?</legend>
              <label className={`${styles.accountTypeOption} ${userType === 'job_seeker' ? styles.accountTypeSelected : ''}`}>
                <input type="radio" name="userType" value="job_seeker" checked={userType === 'job_seeker'} onChange={() => setUserType('job_seeker')} />
                <span><strong>Job Seeker</strong><small>Find jobs, apply for opportunities, save jobs and manage your career profile.</small></span>
              </label>
              <label className={`${styles.accountTypeOption} ${userType === 'employer' ? styles.accountTypeSelected : ''}`}>
                <input type="radio" name="userType" value="employer" checked={userType === 'employer'} onChange={() => setUserType('employer')} />
                <span><strong>Employer</strong><small>Create jobs, find candidates and manage applications.</small></span>
              </label>
            </fieldset>

            <Input
              type="password"
              name="password"
              placeholder="Password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              helperText="At least 8 characters"
              fullWidth
            />

            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
            />

            <div className={styles.terms}>
              <label>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className={styles.termsLink}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className={styles.termsLink}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button type="submit" fullWidth size="lg" className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <div className={styles.socialButtons}>
            <Button variant="outline" fullWidth onClick={handleGoogleSignUp} disabled={loading}>
              {loading ? 'Connecting...' : 'Sign up with Google'}
            </Button>
            <Button variant="outline" fullWidth>
              Sign up with LinkedIn
            </Button>
          </div>

          <div className={styles.signin}>
            <p>
              Already have an account?{' '}
              <Link href="/login" className={styles.signupLink}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
