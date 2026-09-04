import { requireRole } from '@/lib/auth/server';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerSubscriptionPage() {
  const { supabase, user } = await requireRole('employer');
  const { data: rawSubscription } = await supabase.from('subscriptions').select('status, current_period_end, subscription_plans(name, price, currency, billing_interval)').eq('user_id', user.id).in('status', ['trialing', 'active', 'past_due']).maybeSingle();
  const subscription = rawSubscription as unknown as { status: string; current_period_end: string | null; subscription_plans: { name: string; price: number; currency: string; billing_interval: string }[] | null } | null;
  const plan = subscription?.subscription_plans;
  return <main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Subscription</h1><p className={styles.subtitle}>Manage your employer plan and recruitment access.</p></header><Card className={styles.legendCard}><h2 className={styles.legendTitle}>{plan?.[0]?.name || 'Free'}</h2><p>Status: {subscription?.status || 'Active'}</p><p>Renewal date: {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'No renewal date'}</p><p>Plan access is calculated from the active database entitlements.</p></Card></div></main>;
}