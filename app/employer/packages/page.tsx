import Link from 'next/link';
import { getEmployerContext } from '@/lib/auth/server';
import { Card } from '@/components/ui/card';
import { selectEmployerPackage } from './actions';
import styles from './packages.module.css';

type EmployerPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_model: 'one_time' | 'recurring';
  job_posting_allowance: number;
  active_job_limit: number | null;
  duration_days: number | null;
};

const messages: Record<string, string> = {
  'invalid-plan': 'That package selection is invalid. Please choose a package from this page.',
  'company-manager-required': 'A company owner or administrator must select a package.',
  'plan-unavailable': 'This package could not be loaded. Refresh the page and try again.',
  'order-failed': 'We could not prepare the billing review. Please try again or contact support.',
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

function billingPeriod(plan: EmployerPlan) {
  if (plan.billing_model === 'recurring') {
    return plan.duration_days
      ? `Recurring; ${plan.duration_days}-day term (charge interval not configured)`
      : 'Recurring (charge interval not configured)';
  }
  return plan.duration_days ? `One-time; ${plan.duration_days}-day term` : 'One-time purchase';
}

export default async function EmployerPackagesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { supabase, membership } = await getEmployerContext();
  const companyId = membership?.company_id;
  const companyRole = membership?.role;
  const canManageBilling = companyRole === 'owner' || companyRole === 'admin';

  const [{ data: plans, error: plansError }, { data: entitlements, error: entitlementsError }] = await Promise.all([
    supabase
      .from('employer_plans')
      .select('id, code, name, description, price, currency, billing_model, job_posting_allowance, active_job_limit, duration_days')
      .eq('is_active', true)
      .order('price', { ascending: true }),
    companyId
      ? supabase
          .from('billing_entitlements')
          .select('plan_id, expires_at, status')
          .eq('company_id', companyId)
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (plansError) throw plansError;
  if (entitlementsError) throw entitlementsError;

  const availablePlans = (plans || []) as EmployerPlan[];
  const now = Date.now();
  const activeEntitlement = (entitlements || []).find(
    (entitlement) => !entitlement.expires_at || new Date(entitlement.expires_at).getTime() > now,
  );
  const currentPlan = availablePlans.find((plan) => plan.id === activeEntitlement?.plan_id);
  const errorMessage = searchParams.error ? messages[searchParams.error] : undefined;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Employer workspace</p>
          <h1 className={styles.title}>Recruitment packages</h1>
          <p className={styles.subtitle}>
            Compare the active package configuration for your company.
          </p>
        </div>
        <Link className={styles.secondaryAction} href="/employer/billing">View billing</Link>
      </header>

      {errorMessage && <p className={styles.errorNotice} role="alert">{errorMessage}</p>}

      {!canManageBilling && (
        <p className={styles.infoNotice} role="status">
          Package selection and billing details are available to company owners and administrators.
        </p>
      )}

      {currentPlan && (
        <p className={styles.currentNotice} role="status">
          Current active package: <strong>{currentPlan.name}</strong>.
        </p>
      )}

      {availablePlans.length ? (
        <section className={styles.grid} aria-label="Available recruitment packages">
          {availablePlans.map((plan) => {
            const isCurrent = plan.id === activeEntitlement?.plan_id;
            const isIntroductory = plan.code === 'introductory-free';
            return (
              <Card className={`${styles.planCard} ${isCurrent ? styles.currentPlan : ''}`} key={plan.id}>
                <div className={styles.planHeading}>
                  <div>
                    <h2 className={styles.planName}>{plan.name}</h2>
                    <p className={styles.period}>{billingPeriod(plan)}</p>
                  </div>
                  {isCurrent && <span className={styles.currentBadge}>Current</span>}
                </div>

                <p className={styles.price}>{formatPrice(Number(plan.price), plan.currency)}</p>
                {plan.description && <p className={styles.description}>{plan.description}</p>}

                <ul className={styles.entitlements}>
                  <li>{plan.job_posting_allowance} job posting{plan.job_posting_allowance === 1 ? '' : 's'} included</li>
                  <li>
                    {plan.active_job_limit === null
                      ? 'No active-job cap configured'
                      : `Up to ${plan.active_job_limit} active job listings`}
                  </li>
                </ul>

                <p className={styles.unspecified}>
                  Candidate-management features, hiring analytics, and support level are not configured as package entitlements.
                </p>

                {isCurrent ? (
                  <Link className={styles.primaryAction} href="/employer/billing">View current package</Link>
                ) : isIntroductory ? (
                  <Link className={styles.secondaryAction} href="/employer/billing">View included allowance</Link>
                ) : canManageBilling ? (
                  <form action={selectEmployerPackage}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <button className={styles.primaryAction} type="submit">
                      Review package
                    </button>
                  </form>
                ) : (
                  <button className={styles.disabledAction} type="button" disabled>
                    Owner or admin required
                  </button>
                )}
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className={styles.emptyState}>
          <h2>No packages are currently available</h2>
          <p>There are no active employer packages configured for your account.</p>
        </Card>
      )}
    </main>
  );
}
