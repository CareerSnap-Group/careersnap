import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

const applicationStatuses = ['applied', 'submitted', 'viewed', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'] as const;
type ApplicationStatus = typeof applicationStatuses[number];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to update applications.' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profileError || profile?.user_type !== 'employer') return NextResponse.json({ error: 'You do not have access to update this application.' }, { status: 403 });

  const body = await request.json() as { status?: string; notes?: string | null };
  const hasStatus = body.status !== undefined;
  if (hasStatus && !applicationStatuses.includes(body.status as ApplicationStatus)) return NextResponse.json({ error: 'That application status is not supported.' }, { status: 400 });
  if (!hasStatus && body.notes === undefined) return NextResponse.json({ error: 'No application changes were provided.' }, { status: 400 });

  const { data: rawApplication, error: applicationError } = await supabase.from('applications').select('id, jobs!inner(company_id)').eq('id', params.id).maybeSingle();
  const application = rawApplication as unknown as { id: string; jobs: { company_id: string } | { company_id: string }[] | null } | null;
  if (applicationError || !application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
  if (!job?.company_id) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

  const { data: membership, error: membershipError } = await supabase.from('employer_users').select('company_id').eq('company_id', job.company_id).eq('user_id', user.id).in('role', ['owner', 'admin']).maybeSingle();
  if (membershipError || !membership) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

  const changes: Database['public']['Tables']['applications']['Update'] = {
    ...(hasStatus ? { status: body.status as Database['public']['Enums']['application_status'] } : {}),
    ...(body.notes !== undefined ? { notes: body.notes?.trim() || null } : {}),
  };
  const { error: updateError } = await supabase.from('applications').update(changes).eq('id', params.id);
  if (updateError) return NextResponse.json({ error: 'We could not update this application.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}