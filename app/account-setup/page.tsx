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
  const { data: rawProfile } = await supabase.from('profiles').select('user_type, role_initialized').eq('id', user.id).maybeSingle();
  const profile = rawProfile as unknown as { user_type: 'job_seeker' | 'employer'; role_initialized?: boolean } | null;
  if (profile?.user_type === 'employer') redirect('/employer/dashboard');
  const { data: rawRoleState } = await supabase.from('profiles').select('role_initialized').eq('id', user.id).maybeSingle();
  const roleState = rawRoleState as unknown as { role_initialized: boolean } | null;
  return <main className={styles.page}><div className={styles.container}><Card className={styles.legendCard}><h1 className={styles.title}>Complete your CareerSnap account</h1><p className={styles.subtitle}>{roleState?.role_initialized ? 'Your account is ready. Continue to your dashboard.' : 'Choose the experience that fits how you will use CareerSnap.'}</p>{roleState?.role_initialized ? <Link href="/job-seeker/dashboard" className={styles.actionLink}>Continue to your dashboard</Link> : <RoleForm />}</Card></div></main>;
}