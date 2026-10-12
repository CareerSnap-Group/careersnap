'use server';

import { redirect } from 'next/navigation';
import { getEmployerContext } from '@/lib/auth/server';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function selectEmployerPackage(formData: FormData) {
  const planId = formData.get('planId');
  if (typeof planId !== 'string' || !uuidPattern.test(planId)) {
    redirect('/employer/packages?error=invalid-plan');
  }

  const { supabase, membership } = await getEmployerContext();
  const companyId = (membership as { company_id?: string; role?: string } | null)?.company_id;
  const companyRole = (membership as { role?: string } | null)?.role;

  if (!companyId || (companyRole !== 'owner' && companyRole !== 'admin')) {
    redirect('/employer/packages?error=company-manager-required');
  }

  const { data: plan, error: planError } = await supabase
    .from('employer_plans')
    .select('id, price')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle();

  if (planError) {
    console.error('Unable to load selected employer package:', planError);
    redirect('/employer/packages?error=plan-unavailable');
  }

  if (!plan) redirect('/employer/packages?error=plan-unavailable');
  if (Number(plan.price) <= 0) redirect('/employer/billing');

  const { data: orderId, error: orderError } = await supabase.rpc('create_billing_order', {
    p_company_id: companyId,
    p_plan_id: plan.id,
  });

  if (orderError) {
    console.error('Unable to create employer billing order:', orderError);
    redirect('/employer/packages?error=order-failed');
  }

  if (!orderId) {
    console.error('Employer billing order creation returned no order ID.');
    redirect('/employer/packages?error=order-failed');
  }

  redirect(`/employer/billing?order=${encodeURIComponent(orderId)}`);
}
