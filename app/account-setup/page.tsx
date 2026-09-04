import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import styles from '../applications/applications.module.css';

export default async function AccountSetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profile?.user_type === 'employer') redirect('/employer/dashboard');
  return <main className={styles.page}><div className={styles.container}><Card className={styles.legendCard}><h1 className={styles.title}>Complete your CareerSnap account</h1><p className={styles.subtitle}>Your account is ready. Finish your profile to get the most relevant experience.</p><Link href="/job-seeker/dashboard" className={styles.actionLink}>Continue to your dashboard</Link></Card></div></main>;
}