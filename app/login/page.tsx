'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Mock login
    console.log('Login:', { email, password, rememberMe });
    alert('Login functionality is not implemented yet. This is a UI mock.');
  };

  return (
    <div className={styles.authPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to your CareerSnap account</p>
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

            <Button type="submit" fullWidth size="lg" className={styles.submitButton}>
              Sign In
            </Button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <div className={styles.socialButtons}>
            <Button variant="outline" fullWidth>
              Continue with Google
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
