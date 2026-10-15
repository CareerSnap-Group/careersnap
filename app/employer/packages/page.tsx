import Link from 'next/link';
import { getEmployerContext } from '@/lib/auth/server';
import { Card } from '@/components/ui/card';
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

const proposedPackages = [
  {
    name: 'Per Job',
    price: 'R500',
    billing: 'One-time payment per job listing',
    summary: 'Covers one job listing, intended to remain active for 30 days.',
    features: [
      'One job posting for 30 days',
      'Up to 100 job views',
      'Email notifications',
      'Basic analytics',
    ],
    action: 'Post One Job',
    note: 'Purchases are unavailable: this paid plan is not configured and no verified checkout is connected.',
  },
  {
    name: 'Professional',
    price: 'R1,500',
    billing: 'Per month · recurring billing not configured',
    summary: 'Proposed monthly package with a maximum of five active jobs.',
    features: [
      'Up to 5 active jobs',
      'Unlimited job views',
      'Priority support',
      'Advanced analytics',
      'Featured job listings',
      'Social media posting',
    ],
    action: 'Choose Professional',
    note: 'Subscriptions are unavailable: recurring billing and the paid plan are not configured.',
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom pricing',
    billing: 'For large teams',
    summary: 'Proposed enterprise package for teams with larger hiring needs.',
    features: [
      'Unlimited job postings',
      'Unlimited applications',
      'Dedicated support',
      'Custom branding',
      'API access',
      'Bulk hiring tools',
    ],
    action: 'Contact Sales',
    note: 'Enterprise service and a verified sales contact are not configured.',
  },
];

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
  const introductoryPlan = availablePlans.find((plan) => plan.code === 'introductory-free');

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Employer workspace</p>
          <h1 className={styles.title}>Recruitment packages</h1>
          <p className={styles.subtitle}>
            Compare package pricing and terms. Paid package checkout is not currently available.
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

      {introductoryPlan && (
        <Card className={styles.allowanceCard}>
          <div>
            <p className={styles.cardEyebrow}>Included introductory allowance</p>
            <h2>{introductoryPlan.name}</h2>
            <p>Four lifetime job postings for eligible new employers are used before paid entitlements.</p>
          </div>
          <Link className={styles.secondaryAction} href="/employer/billing">View allowance</Link>
        </Card>
      )}

      <p className={styles.availabilityNotice} role="status">
        These prices and package features are for presentation only. Paid plans are not configured in billing, no verified payment checkout is available, and these features are not active entitlements. Selecting a package will not create an order or grant access.
      </p>

      <section className={styles.grid} aria-label="Employer pricing packages">
        {proposedPackages.map((packageOffer) => (
          <Card
            className={`${styles.planCard} ${'recommended' in packageOffer && packageOffer.recommended ? styles.recommendedPlan : ''}`}
            key={packageOffer.name}
          >
            {'recommended' in packageOffer && packageOffer.recommended && (
              <span className={styles.recommendedBadge}>Recommended</span>
            )}
            <div className={styles.planHeading}>
              <h2 className={styles.planName}>{packageOffer.name}</h2>
              <p className={styles.period}>{packageOffer.billing}</p>
            </div>
            <p className={styles.price}>{packageOffer.price}</p>
            {packageOffer.name === 'Professional' && <p className={styles.limitEmphasis}>Up to 5 active jobs · monthly</p>}
            <p className={styles.description}>{packageOffer.summary}</p>

            <ul className={styles.entitlements}>
              {packageOffer.features.map((feature) => (
                <li key={feature}>
                  <span>{feature}</span>
                  <span className={styles.featureStatus}>Not active</span>
                </li>
              ))}
            </ul>

            <div className={styles.packageAction}>
              <button className={styles.disabledAction} type="button" disabled>
                {packageOffer.action}
              </button>
              <p>{packageOffer.note}</p>
              {!canManageBilling && <p>Package selection is restricted to company owners and administrators.</p>}
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
