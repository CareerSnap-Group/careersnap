import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to post a job.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).maybeSingle();
  if (profile?.user_type !== 'employer') return NextResponse.json({ error: "You don't have access to employer tools." }, { status: 403 });

  const { data: membership, error: membershipError } = await supabase
    .from('employer_users')
    .select('company_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError) return NextResponse.json({ error: 'We could not load your company membership.' }, { status: 500 });
  if (!membership) {
    return NextResponse.json({
      code: 'company_setup_required',
      error: 'Set up or claim your company before posting a job.',
      redirect_to: '/employer/company',
    }, { status: 409 });
  }

  const body = await request.json() as { jobTitle?: string; company?: string; location?: string; workLocation?: string; jobType?: string; experienceLevel?: string; salaryMin?: string; salaryMax?: string; currency?: string; description?: string; responsibilities?: string; requirements?: string; benefits?: string; status?: string };
  if (!body.jobTitle || !body.company || !body.location || !body.description || !body.requirements) return NextResponse.json({ error: 'Please complete the required job details.' }, { status: 400 });
  if (body.status && !['draft', 'published'].includes(body.status)) return NextResponse.json({ error: 'That job status is not supported.' }, { status: 400 });

  const status = body.status || 'published';
  const { error } = await supabase.from('jobs').insert({
    company_id: membership.company_id, created_by: user.id, title: body.jobTitle, slug: `${slugify(body.jobTitle)}-${Date.now()}`,
    description: body.description, responsibilities: (body.responsibilities || '').split('\n').filter(Boolean), requirements: body.requirements.split('\n').filter(Boolean), benefits: (body.benefits || '').split('\n').filter(Boolean),
    location: body.location, work_location: body.workLocation || 'hybrid', job_type: body.jobType || 'full-time', experience_level: body.experienceLevel || 'mid',
    salary_min: body.salaryMin ? Number(body.salaryMin) : null, salary_max: body.salaryMax ? Number(body.salaryMax) : null, salary_currency: body.currency || 'ZAR', status, published_at: status === 'published' ? new Date().toISOString() : null, expires_at: null,
  });
  if (error) {
    if (error.message.includes('No free job postings or active paid job package remains')) {
      return NextResponse.json({ error: 'Your 4 free job postings have been used. Choose a package to continue posting jobs.' }, { status: 402 });
    }
    return NextResponse.json({ error: error.message.includes('can_create_job') ? 'Your current plan has reached its active job limit.' : 'We could not post this job.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}