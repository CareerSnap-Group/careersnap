'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import styles from '../../login/auth.module.css';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!isSupabaseConfigured()) return setMessage('Connect your Supabase project by filling in .env.local first.');
    if (password.length < 8) return setMessage('Password must be at least 8 characters.');
    if (password !== confirmation) return setMessage('Passwords do not match.');

    const { error } = await createClient().auth.updateUser({ password });
    if (error) return setMessage(error.message);
    router.push('/profile');
  };

  return <main className={styles.authPage}><div className={styles.container}><div className={styles.formCard}>
    <div className={styles.formHeader}><h1 className={styles.title}>Choose a new password</h1><p className={styles.subtitle}>Set a secure password for your CareerSnap account.</p></div>
    <form onSubmit={handleSubmit} className={styles.form}>
      {message && <div className={styles.error}>{message}</div>}
      <Input type="password" label="New password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth />
      <Input type="password" label="Confirm password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} fullWidth />
      <Button type="submit" fullWidth size="lg">Update Password</Button>
    </form>
  </div></div></main>;
}