import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import styles from '../applications/applications.module.css';
import { RoleForm } from './role-form';

export default async function AccountSetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  let { data: rawProfile, error: profileError } = await supabase.from('profiles').select('user_type, role_initialized').eq('id', user.id).maybeSingle();
  if (profileError?.code === '42703') {
    const legacyProfile = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
    rawProfile = legacyProfile.data ? { ...legacyProfile.data, role_initialized: true } : null;
    profileError = legacyProfile.error;
  }
  const profile = rawProfile as unknown as { user_type: 'job_seeker' | 'employer'; role_initialized?: boolean } | null;
  if (profileError) throw new Error('Unable to load account role.');
  if (profile?.user_type && profile.role_initialized !== false) {
    redirect(profile.user_type === 'employer' ? '/employer/dashboard' : '/job-seeker/dashboard');
  }
  const initialRole = profile?.role_initialized === false ? profile.user_type : undefined;
  return <main className={styles.page}><div className={styles.container}><Card className={styles.legendCard}><h1 className={styles.title}>Complete your CareerSnap account</h1><p className={styles.subtitle}>Choose the experience that fits how you will use CareerSnap.</p><RoleForm initialRole={initialRole} /></Card></div></main>;
}