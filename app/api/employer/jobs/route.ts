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

  const body = await request.json() as { jobTitle?: string; company?: string; location?: string; workLocation?: string; jobType?: string; experienceLevel?: string; salaryMin?: string; salaryMax?: string; currency?: string; description?: string; responsibilities?: string; requirements?: string; benefits?: string };
  if (!body.jobTitle || !body.company || !body.location || !body.description || !body.requirements) return NextResponse.json({ error: 'Please complete the required job details.' }, { status: 400 });

  let { data: membership } = await supabase.from('employer_users').select('company_id').eq('user_id', user.id).limit(1).maybeSingle();
  if (!membership) {
    const { data: company, error: companyError } = await supabase.from('companies').insert({ name: body.company, slug: `${slugify(body.company)}-${user.id.slice(0, 8)}`, created_by: user.id, description: null, website_url: null, logo_url: null }).select('id').single();
    if (companyError || !company) return NextResponse.json({ error: 'We could not set up your company yet.' }, { status: 400 });
    membership = { company_id: company.id };
  }

  const { error } = await supabase.from('jobs').insert({
    company_id: membership.company_id, created_by: user.id, title: body.jobTitle, slug: `${slugify(body.jobTitle)}-${Date.now()}`,
    description: body.description, responsibilities: (body.responsibilities || '').split('\n').filter(Boolean), requirements: body.requirements.split('\n').filter(Boolean), benefits: (body.benefits || '').split('\n').filter(Boolean),
    location: body.location, work_location: body.workLocation || 'hybrid', job_type: body.jobType || 'full-time', experience_level: body.experienceLevel || 'mid',
    salary_min: body.salaryMin ? Number(body.salaryMin) : null, salary_max: body.salaryMax ? Number(body.salaryMax) : null, salary_currency: body.currency || 'ZAR', status: 'published', published_at: new Date().toISOString(), expires_at: null,
  });
  if (error) return NextResponse.json({ error: error.message.includes('can_create_job') ? 'Your current plan has reached its active job limit.' : 'We could not post this job.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}