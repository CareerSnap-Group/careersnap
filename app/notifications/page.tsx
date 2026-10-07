import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { Header } from '@/components/layout/header';
import { EmployerHeader } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { NotificationList } from './notification-list';
import styles from './notifications.module.css';

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fnotifications');

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const notifications = (data || []) as Database['public']['Tables']['notifications']['Row'][];
  return (
    <div className={styles.page}>
      {profile?.user_type === 'employer' ? <EmployerHeader /> : <Header />}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Application updates and new applications for your jobs.</p>
        </header>
        <NotificationList notifications={notifications} unavailable={Boolean(error)} />
      </main>
      <Footer />
    </div>
  );
}