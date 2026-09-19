import { requireRole } from '@/lib/auth/server';
import { getCurrentCompanyBillingContext } from '@/lib/billing/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Card } from '@/components/ui/card';
import styles from '../../applications/applications.module.css';

export default async function EmployerSubscriptionPage() {
  const { supabase, user } = await requireRole('employer');
  const { data: membership } = await supabase.from('employer_users').select('company_id, companies(name)').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
  const billingContext = await getCurrentCompanyBillingContext();
  const activeEntitlement = billingContext.activeEntitlement;
  const plan = billingContext.plan;
  const companyName = Array.isArray((membership as any)?.companies)
    ? (membership as any).companies[0]?.name ?? 'No company linked'
    : billingContext.companyName ?? 'No company linked';
  const remainingAllowance = activeEntitlement ? Math.max(activeEntitlement.granted_quantity - activeEntitlement.consumed_quantity, 0) : 0;
  const packageStatus = activeEntitlement?.status ?? 'No package active';
  const activeLimit = activeEntitlement?.active_job_limit ?? null;
  const expiryDate = activeEntitlement?.expires_at ? new Date(activeEntitlement.expires_at).toLocaleDateString() : 'No expiry';

  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Subscription</h1><p className={styles.subtitle}>Manage your employer package and recruitment access.</p></header><Card className={styles.legendCard}><h2 className={styles.legendTitle}>{plan?.name || 'No package active'}</h2><p>Company: {companyName}</p><p>Status: {packageStatus}</p><p>Price: {plan ? `${plan.currency} ${Number(plan.price).toFixed(2)}` : 'No package active'}</p><p>Remaining postings: {activeEntitlement ? `${remainingAllowance}` : '0'}</p><p>Active job limit: {activeLimit === null ? 'No active-job cap configured' : `${activeLimit}`}</p><p>Expiry: {expiryDate}</p><p>Plan access is calculated from the company-owned billing entitlement model.</p></Card></div></main></>;
}