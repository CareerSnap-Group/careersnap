'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateSettings, type SettingsState } from './actions';
import styles from './settings.module.css';

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending}>{pending ? 'Saving...' : 'Save changes'}</Button>;
}

export function SettingsForm({ profile }: { profile: { email: string; full_name: string; headline: string; bio: string; location: string; allow_employer_discovery: boolean; availability: string } }) {
  const initialState: SettingsState = { error: '', success: '' };
  const [state, formAction] = useFormState(updateSettings, initialState);

  return (
    <form action={formAction} className={styles.form}>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      {state.success && <p className={styles.success} role="status">{state.success}</p>}
      <div className={styles.fields}>
        <Input name="full_name" label="Full name" defaultValue={profile.full_name} autoComplete="name" />
        <Input name="email" label="Email address" value={profile.email} readOnly helperText="Your sign-in email is managed through your account." />
        <Input name="headline" label="Professional headline" defaultValue={profile.headline} placeholder="e.g. Frontend Developer" />
        <Input name="location" label="Location" defaultValue={profile.location} placeholder="e.g. Johannesburg, South Africa" />
        <label className={styles.field} htmlFor="bio"><span>About you</span><textarea id="bio" name="bio" defaultValue={profile.bio} rows={5} placeholder="Share a short professional summary." /></label>
        <label className={styles.checkbox}><input type="checkbox" name="allow_employer_discovery" defaultChecked={profile.allow_employer_discovery} /><span>Allow employers to discover my professional profile</span></label>
        <label className={styles.field} htmlFor="availability"><span>Availability</span><select id="availability" name="availability" defaultValue={profile.availability || 'not_specified'}><option value="not_specified">Not specified</option><option value="immediately">Immediately</option><option value="notice_period">Notice period</option><option value="not_available">Not available</option></select></label>
      </div>
      <div className={styles.actions}><SaveButton /></div>
    </form>
  );
}