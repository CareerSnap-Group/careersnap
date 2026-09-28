drop policy if exists "Company managers view billing orders" on public.billing_orders;
create policy "Company managers view billing orders"
  on public.billing_orders for select to authenticated
  using (public.can_edit_company_profile(company_id));

drop policy if exists "Company managers view billing transactions" on public.billing_transactions;
create policy "Company managers view billing transactions"
  on public.billing_transactions for select to authenticated
  using (public.can_edit_company_profile(company_id));

drop policy if exists "Company managers view billing entitlements" on public.billing_entitlements;
create policy "Company managers view billing entitlements"
  on public.billing_entitlements for select to authenticated
  using (public.can_edit_company_profile(company_id));

drop policy if exists "Company managers view entitlement usage" on public.billing_entitlement_usage;
create policy "Company managers view entitlement usage"
  on public.billing_entitlement_usage for select to authenticated
  using (public.can_edit_company_profile(company_id));