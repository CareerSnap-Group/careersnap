import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

type Company = Database['public']['Tables']['companies']['Row'];

type RatingRow = { company_id: string; rating: number; user_id: string };

export type CompanyRatingSummary = {
  average: number;
  count: number;
  userRating: number | null;
};

export type CompanyDirectoryItem = Pick<Company, 'id' | 'name' | 'slug' | 'description' | 'logo_url' | 'industry' | 'location'> & {
  activeJobCount: number;
  rating: CompanyRatingSummary;
};

export type CompanyProfileData = CompanyDirectoryItem & {
  website: string | null;
  websiteUrl: string | null;
  jobs: Array<{ id: string; title: string; location: string; jobType: string; workLocation: string }>;
};

const companyFields = 'id, name, slug, description, logo_url, industry, location, website, website_url';

function summarizeRatings(ratings: RatingRow[], companyId: string, userId: string | null): CompanyRatingSummary {
  const companyRatings = ratings.filter((rating) => rating.company_id === companyId);
  const total = companyRatings.reduce((sum, rating) => sum + rating.rating, 0);
  return {
    average: companyRatings.length ? total / companyRatings.length : 0,
    count: companyRatings.length,
    userRating: userId ? companyRatings.find((rating) => rating.user_id === userId)?.rating || null : null,
  };
}

export async function getCompanyDirectory(): Promise<CompanyDirectoryItem[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const expiry = new Date().toISOString();
  const [{ data: companies }, { data: jobs }, { data: summaries }] = await Promise.all([
    supabase.from('companies').select(companyFields).order('name'),
    supabase.from('jobs').select('id, company_id').eq('status', 'published').or(`expires_at.is.null,expires_at.gt.${expiry}`),
    supabase.from('company_rating_summaries').select('company_id, average_rating, rating_count'),
  ]);

  const activeJobCounts = new Map<string, number>();
  (jobs || []).forEach((job) => activeJobCounts.set(job.company_id, (activeJobCounts.get(job.company_id) || 0) + 1));
  return (companies || []).map((company) => {
    const summary = summaries?.find((item) => item.company_id === company.id);
    return {
    ...company,
    activeJobCount: activeJobCounts.get(company.id) || 0,
    rating: { average: summary?.average_rating || 0, count: summary?.rating_count || 0, userRating: null },
    };
  });
}

export async function getCompanyProfile(id: string): Promise<CompanyProfileData | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const expiry = new Date().toISOString();
  const [{ data: company }, { data: jobs }, { data: summary }, { data: ownRating }] = await Promise.all([
    supabase.from('companies').select(companyFields).eq('id', id).maybeSingle(),
    supabase.from('jobs').select('id, title, location, job_type, work_location').eq('company_id', id).eq('status', 'published').or(`expires_at.is.null,expires_at.gt.${expiry}`).order('created_at', { ascending: false }),
    supabase.from('company_rating_summaries').select('average_rating, rating_count').eq('company_id', id).maybeSingle(),
    user ? supabase.from('company_ratings').select('rating').eq('company_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (!company) return null;
  return {
    ...company,
    activeJobCount: jobs?.length || 0,
    rating: { average: summary?.average_rating || 0, count: summary?.rating_count || 0, userRating: ownRating?.rating || null },
    website: company.website,
    websiteUrl: company.website_url,
    jobs: (jobs || []).map((job) => ({ id: job.id, title: job.title, location: job.location, jobType: job.job_type, workLocation: job.work_location })),
  };
}
