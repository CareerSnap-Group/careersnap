'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import styles from './delete-account.module.css';

export function DeleteAccount() {
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const deleteAccount = async () => {
    if (confirmation !== 'DELETE') return;
    setBusy(true);
    setError('');
    const response = await fetch('/api/account/delete', { method: 'POST' });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error || 'We could not delete your account.');
      setBusy(false);
      return;
    }
    await createClient().auth.signOut();
    window.location.assign('/');
  };

  return (
    <section className={styles.section} aria-labelledby="delete-account-title">
      <h2 id="delete-account-title" className={styles.title}>Delete account</h2>
      <p className={styles.description}>Permanently delete your CareerSnap account and personal data. This action cannot be undone.</p>
      <label className={styles.label} htmlFor="delete-account-confirmation">Type DELETE to confirm</label>
      <input
        id="delete-account-confirmation"
        className={styles.input}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        disabled={busy}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <Button type="button" variant="danger" disabled={busy || confirmation !== 'DELETE'} onClick={deleteAccount}>
        {busy ? 'Deleting account...' : 'Delete account permanently'}
      </Button>
    </section>
  );
}
