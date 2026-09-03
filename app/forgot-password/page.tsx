'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Mock submit
    console.log('Reset password:', { email });
    setSubmitted(true);
  };

  return (
    <div className={styles.authPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>Enter your email to receive reset instructions</p>
          </div>

          {submitted ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successTitle}>Check your email</h2>
              <p className={styles.successText}>We've sent password reset instructions to {email}</p>
              <Link href="/login">
                <Button fullWidth>Back to Login</Button>
              </Link>
            </div>
          ) : (
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

              <Button type="submit" fullWidth size="lg" className={styles.submitButton}>
                Send Reset Link
              </Button>

              <div className={styles.backLink}>
                <Link href="/login">← Back to login</Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
