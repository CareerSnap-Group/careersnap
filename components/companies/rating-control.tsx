'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import styles from './rating-control.module.css';

export function RatingControl({ companyId, initialRating, signedIn }: { companyId: string; initialRating: number | null; signedIn: boolean }) {
  const [rating, setRating] = useState(initialRating);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const submitRating = async (value: number) => {
    if (!signedIn) {
      setMessage('Sign in or register as a Job Seeker to rate this company.');
      return;
    }
    setSaving(true);
    setMessage('');
    const response = await fetch(`/api/companies/${companyId}/rating`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: value }) });
    const result = await response.json().catch(() => null) as { rating?: number; error?: string } | null;
    setSaving(false);
    if (!response.ok || !result?.rating) {
      setMessage(result?.error || 'We could not save your rating.');
      return;
    }
    setRating(result.rating);
    setMessage('Your rating was saved.');
  };

  return <div className={styles.control}>
    <p className={styles.label}>Your rating</p>
    <div className={styles.stars} aria-label="Rate this company from 1 to 5 stars">
      {Array.from({ length: 5 }, (_, index) => { const value = index + 1; return <button key={value} type="button" className={`${styles.star} ${rating && value <= rating ? styles.selected : ''}`} onClick={() => submitRating(value)} disabled={saving} aria-label={`Rate ${value} out of 5`}><Icon name="star" size={24} /></button>; })}
    </div>
    <p className={styles.message} role="status">{message || (signedIn ? 'Update your rating anytime.' : 'Sign in to leave an optional rating.')}</p>
  </div>;
}
