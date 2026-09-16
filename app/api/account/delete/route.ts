import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function unique(values: string[]) {
  return [...new Set(values)];
}

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to delete your account.' }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Account deletion is not configured.' }, { status: 503 });

  const { data: memberships, error: membershipError } = await admin
    .from('employer_users')
    .select('company_id, role, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (membershipError) return NextResponse.json({ error: 'We could not prepare your account for deletion.' }, { status: 500 });

  const companyIds = new Set((memberships || []).map((membership) => membership.company_id));
  const [{ data: ownedCompanies, error: ownedCompaniesError }, { data: ownedJobs, error: ownedJobsError }] = await Promise.all([
    admin.from('companies').select('id').eq('created_by', user.id),
    admin.from('jobs').select('company_id').eq('created_by', user.id),
  ]);
  if (ownedCompaniesError || ownedJobsError) return NextResponse.json({ error: 'We could not prepare your business records for deletion.' }, { status: 500 });
  (ownedCompanies || []).forEach((company) => companyIds.add(company.id));
  (ownedJobs || []).forEach((job) => companyIds.add(job.company_id));
  const { data: resumes, error: resumeQueryError } = await admin
    .from('resumes')
    .select('storage_path')
    .eq('user_id', user.id);
  if (resumeQueryError) return NextResponse.json({ error: 'We could not prepare your uploaded files for deletion.' }, { status: 500 });

  const storagePaths = (resumes || []).map((resume) => resume.storage_path).filter(Boolean);
  if (storagePaths.length) {
    const { error: storageError } = await admin.storage.from('resumes').remove(storagePaths);
    if (storageError) return NextResponse.json({ error: 'We could not remove your uploaded files. Your account was not deleted.' }, { status: 500 });
  }

  for (const companyId of companyIds) {
    const { data: companyMembers, error: companyMembersError } = await admin
      .from('employer_users')
      .select('user_id, role, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });
    if (companyMembersError) return NextResponse.json({ error: 'We could not prepare your company memberships for deletion.' }, { status: 500 });

    const remainingMembers = (companyMembers || []).filter((member) => member.user_id !== user.id);
    if (remainingMembers.length === 0) {
      const { error: orphanJobsError } = await admin.from('jobs').update({ created_by: null }).eq('company_id', companyId).eq('created_by', user.id);
      if (orphanJobsError) return NextResponse.json({ error: 'We could not preserve your company jobs. Your account was not deleted.' }, { status: 500 });
      const { error: orphanCompanyError } = await admin.from('companies').update({ created_by: null }).eq('id', companyId).eq('created_by', user.id);
      if (orphanCompanyError) return NextResponse.json({ error: 'We could not preserve your company. Your account was not deleted.' }, { status: 500 });
      continue;
    }

    const remainingOwner = remainingMembers.find((member) => member.role === 'owner');
    const replacement = remainingOwner || remainingMembers.find((member) => member.role === 'admin') || remainingMembers[0];
    if (!remainingOwner) {
      const { error: promoteError } = await admin.from('employer_users').update({ role: 'owner' }).eq('company_id', companyId).eq('user_id', replacement.user_id);
      if (promoteError) return NextResponse.json({ error: 'We could not preserve company ownership. Your account was not deleted.' }, { status: 500 });
    }
    const { error: jobOwnerError } = await admin.from('jobs').update({ created_by: replacement.user_id }).eq('company_id', companyId).eq('created_by', user.id);
    if (jobOwnerError) return NextResponse.json({ error: 'We could not preserve your company jobs. Your account was not deleted.' }, { status: 500 });
    const { error: companyOwnerError } = await admin.from('companies').update({ created_by: replacement.user_id }).eq('id', companyId).eq('created_by', user.id);
    if (companyOwnerError) return NextResponse.json({ error: 'We could not preserve your company ownership. Your account was not deleted.' }, { status: 500 });
  }

  const { error: profileError } = await admin.from('profiles').delete().eq('id', user.id);
  if (profileError) return NextResponse.json({ error: 'We could not delete your personal account data.' }, { status: 500 });

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) return NextResponse.json({ error: 'Your account data was removed, but the authentication account could not be deleted. Please contact support.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
