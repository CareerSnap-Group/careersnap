import Link from 'next/link';
import { getEmployerContext } from '@/lib/auth/server';
import { getCurrentCompanyBillingContext } from '@/lib/billing/server';
import { Card } from '@/components/ui/card';
import type { Json } from '@/lib/supabase/database.types';
import styles from './billing.module.css';

type Order = {
  id: string;
  plan_id: string;
  status: string;
  amount: number;
  currency: string;
  plan_snapshot: Json;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
};

type Transaction = {
  id: string;
  order_id: string;
  provider: string;
  provider_status: string | null;
  status: string;
  amount: number;
  currency: string;
  failure_message: string | null;
  paid_at: string | null;
  created_at: string;
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function snapshotObject(value: Json): Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}

function displayStatus(status: string) {
  return status.split('_').join(' ');
}

function orderPeriod(snapshot: Record<string, Json | undefined>) {
  const model = snapshot.billing_model;
  const duration = snapshot.duration_days;
  if (model === 'recurring') {
    return typeof duration === 'number'
      ? `Recurring; ${duration}-day term (charge interval not configured)`
      : 'Recurring (charge interval not configured)';
  }
  return typeof duration === 'number' ? `One-time; ${duration}-day term` : 'One-time purchase';
}

export default async function EmployerBillingPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const { supabase, membership } = await getEmployerContext();
  const companyId = membership?.company_id;
  const companyRole = membership?.role;
  const canManageBilling = companyRole === 'owner' || companyRole === 'admin';
  const billingContext = await getCurrentCompanyBillingContext();
  const companyName = billingContext.companyName || 'Your company';

  if (!companyId || !canManageBilling) {
    return (
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Employer workspace</p>
          <h1 className={styles.title}>Billing</h1>
        </header>
        <Card className={styles.notice}>
          <h2>Company billing access required</h2>
          <p>Only a company owner or administrator can view billing records.</p>
          <Link href="/employer/dashboard">Back to dashboard</Link>
        </Card>
      </main>
    );
  }

  const { data: orderRows, error: orderError } = await supabase
    .from('billing_orders')
    .select('id, plan_id, status, amount, currency, plan_snapshot, expires_at, paid_at, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (orderError) throw orderError;
  const orders = (orderRows || []) as Order[];
  const selectedOrderId = searchParams.order;
  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) : undefined;
  const orderIds = orders.map((order) => order.id);
  let transactions: Transaction[] = [];

  if (orderIds.length) {
    const { data, error } = await supabase
      .from('billing_transactions')
      .select('id, order_id, provider, provider_status, status, amount, currency, failure_message, paid_at, created_at')
      .eq('company_id', companyId)
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    transactions = (data || []) as Transaction[];
  }

  const selectedSnapshot = selectedOrder ? snapshotObject(selectedOrder.plan_snapshot) : null;
  const selectedTransactions = transactions.filter((transaction) => transaction.order_id === selectedOrder?.id);
  const successfulTransaction = selectedTransactions.find((transaction) => transaction.status === 'succeeded');
  const failedTransaction = selectedTransactions.find((transaction) => transaction.status === 'failed');
  const currentEntitlement = billingContext.activeEntitlement;
  const currentPlan = billingContext.plan;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Employer workspace · {companyName}</p>
          <h1 className={styles.title}>Billing</h1>
          <p className={styles.subtitle}>Review your package, order status, and billing history.</p>
        </div>
        <Link className={styles.secondaryAction} href="/employer/packages">Browse packages</Link>
      </header>

      {currentEntitlement && (
        <Card className={styles.currentCard}>
          <div>
            <p className={styles.cardEyebrow}>Current package</p>
            <h2>{currentPlan?.name || 'Active employer entitlement'}</h2>
            <p>Status: {displayStatus(currentEntitlement.status)}</p>
            <p>
              Postings remaining: {Math.max(currentEntitlement.granted_quantity - currentEntitlement.consumed_quantity, 0)}
              {currentEntitlement.active_job_limit === null ? '' : ` · Active job limit: ${currentEntitlement.active_job_limit}`}
            </p>
            <p>Expires: {currentEntitlement.expires_at ? new Date(currentEntitlement.expires_at).toLocaleDateString() : 'No expiry configured'}</p>
          </div>
        </Card>
      )}

      {selectedOrderId && !selectedOrder && (
        <div role="status">
          <Card className={styles.notice}>
            <h2>Order not found</h2>
            <p>This order is not available for the company associated with your account.</p>
            <Link href="/employer/packages">Return to packages</Link>
          </Card>
        </div>
      )}

      {selectedOrder && selectedSnapshot && (
        <Card className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <div>
              <p className={styles.cardEyebrow}>Package order review</p>
              <h2>{String(selectedSnapshot.name || 'Employer package')}</h2>
              <p>Order {selectedOrder.id}</p>
            </div>
            <span className={styles.statusBadge} data-status={selectedOrder.status}>
              {displayStatus(selectedOrder.status)}
            </span>
          </div>

          <dl className={styles.orderDetails}>
            <div><dt>Price</dt><dd>{formatPrice(Number(selectedOrder.amount), selectedOrder.currency)}</dd></div>
            <div><dt>Billing period</dt><dd>{orderPeriod(selectedSnapshot)}</dd></div>
            <div><dt>Job posting allowance</dt><dd>{String(selectedSnapshot.job_posting_allowance ?? 'Not specified')}</dd></div>
            <div><dt>Active job limit</dt><dd>{selectedSnapshot.active_job_limit === null ? 'Not configured' : String(selectedSnapshot.active_job_limit ?? 'Not specified')}</dd></div>
            <div><dt>Tax</dt><dd>No tax configuration is available for this order.</dd></div>
            <div><dt>Total payable</dt><dd>{formatPrice(Number(selectedOrder.amount), selectedOrder.currency)}</dd></div>
          </dl>

          {selectedOrder.status === 'paid' ? (
            <p className={styles.successNotice} role="status">
              Payment confirmed by the billing system{selectedOrder.paid_at ? ` on ${new Date(selectedOrder.paid_at).toLocaleString()}` : ''}.
              {successfulTransaction && ` Provider transaction: ${successfulTransaction.provider}.`}
            </p>
          ) : selectedOrder.status === 'failed' ? (
            <p className={styles.errorNotice} role="alert">This order has failed. Select the package again to review a new order.</p>
          ) : selectedOrder.status === 'cancelled' || selectedOrder.status === 'expired' ? (
            <p className={styles.noticeText}>This order is {displayStatus(selectedOrder.status)}. Choose a package to start a new review.</p>
          ) : selectedOrder.status === 'refunded' || selectedOrder.status === 'partially_refunded' ? (
            <p className={styles.noticeText}>This order has a {displayStatus(selectedOrder.status)} status. Contact support if you need assistance.</p>
          ) : failedTransaction ? (
            <p className={styles.errorNotice} role="status">
              The recorded payment attempt failed{failedTransaction.failure_message ? `: ${failedTransaction.failure_message}` : '.'}
              {' '}The order remains unpaid; online checkout is unavailable.
            </p>
          ) : (
            <>
              <p className={styles.noticeText}>
                This order is awaiting payment. Online checkout is unavailable because no payment provider checkout or verified confirmation handler is configured in this application.
              </p>
              <button className={styles.disabledAction} type="button" disabled>
                Payment unavailable
              </button>
            </>
          )}
        </Card>
      )}

      {!selectedOrderId && !currentEntitlement && orders.length === 0 && (
        <Card className={styles.notice}>
          <h2>No package selected</h2>
          <p>Select a configured employer package to review its terms and create a billing order.</p>
          <Link className={styles.primaryAction} href="/employer/packages">Browse packages</Link>
        </Card>
      )}

      {orders.length > 0 && (
        <section className={styles.history} aria-labelledby="billing-history-title">
          <div className={styles.historyHeading}>
            <h2 id="billing-history-title">Billing history</h2>
            <p>Orders and payment attempts recorded for your company.</p>
          </div>
          <div className={styles.historyList}>
            {orders.map((order) => {
              const snapshot = snapshotObject(order.plan_snapshot);
              const transaction = transactions.find((entry) => entry.order_id === order.id);
              return (
                <Card className={styles.historyItem} key={order.id}>
                  <div>
                    <h3>{String(snapshot.name || 'Employer package')}</h3>
                    <p>{new Date(order.created_at).toLocaleDateString()} · {formatPrice(Number(order.amount), order.currency)}</p>
                    {transaction && <p>Payment attempt: {displayStatus(transaction.status)} · {transaction.provider}</p>}
                    {transaction?.failure_message && <p>{transaction.failure_message}</p>}
                  </div>
                  <div className={styles.historyActions}>
                    <span className={styles.statusBadge} data-status={order.status}>{displayStatus(order.status)}</span>
                    <Link href={`/employer/billing?order=${encodeURIComponent(order.id)}`}>Review</Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
