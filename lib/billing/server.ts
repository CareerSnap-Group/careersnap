import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/server';

export async function listActiveEmployerPlans() {
  const { supabase } = await requireRole('employer');
  const { data, error } = await supabase
    .from('employer_plans')
    .select('id, code, name, description, price, currency, billing_model, job_posting_allowance, active_job_limit, duration_days')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCurrentCompanyBillingContext() {
  const { supabase, user } = await requireRole('employer');
  const { data: membership, error: membershipError } = await supabase
    .from('employer_users')
    .select('company_id, companies(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    return {
      company: null,
      companyName: null,
      companyId: null,
      activeEntitlement: null,
      plan: null,
      entitlements: [],
    };
  }

  const companyId = membership.company_id as string | null;
  const companyName = Array.isArray((membership as any).companies)
    ? (membership as any).companies[0]?.name ?? null
    : null;

  if (!companyId) {
    return {
      company: null,
      companyName: null,
      companyId: null,
      activeEntitlement: null,
      plan: null,
      entitlements: [],
    };
  }

  const { data: entitlements, error: entitlementError } = await supabase
    .from('billing_entitlements')
    .select('id, company_id, order_id, plan_id, granted_quantity, consumed_quantity, active_job_limit, starts_at, expires_at, status')
    .eq('company_id', companyId)
    .order('starts_at', { ascending: false });

  if (entitlementError) throw entitlementError;

  const now = new Date().toISOString();
  const activeEntitlement = (entitlements ?? []).find((entry: any) => {
    if (entry.status !== 'active') return false;
    if (entry.starts_at && entry.starts_at > now) return false;
    if (entry.expires_at && entry.expires_at <= now) return false;
    return true;
  }) ?? null;

  const { data: plan, error: planError } = activeEntitlement
    ? await supabase
        .from('employer_plans')
        .select('id, code, name, description, price, currency, billing_model, job_posting_allowance, active_job_limit, duration_days, is_active')
        .eq('id', activeEntitlement.plan_id)
        .maybeSingle()
    : { data: null, error: null };

  if (planError) throw planError;

  return {
    company: membership,
    companyName,
    companyId,
    activeEntitlement,
    plan,
    entitlements: entitlements ?? [],
  };
}

export async function getCompanyBillingData(companyId: string) {
  const { supabase, user } = await requireRole('employer');
  const { data: membership, error: membershipError } = await supabase
    .from('employer_users')
    .select('company_id')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const [orders, transactions, entitlements] = await Promise.all([
    supabase
      .from('billing_orders')
      .select('id, company_id, plan_id, status, amount, currency, plan_snapshot, checkout_url, expires_at, paid_at, created_at, updated_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_transactions')
      .select('id, order_id, company_id, provider, provider_status, status, amount, currency, paid_at, refunded_at, created_at, updated_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_entitlements')
      .select('id, company_id, order_id, plan_id, granted_quantity, consumed_quantity, active_job_limit, starts_at, expires_at, status, created_at, updated_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  if (orders.error) throw orders.error;
  if (transactions.error) throw transactions.error;
  if (entitlements.error) throw entitlements.error;

  return {
    orders: orders.data,
    transactions: transactions.data,
    entitlements: entitlements.data,
  };
}