import { getEmployerContext } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { DeleteAccount } from '@/components/account/delete-account';
import { CompanyForm } from './company-form';
import styles from '../../applications/applications.module.css';

export default async function EmployerCompanyPage() {
  const { membership, supabase, user } = await getEmployerContext();
  const companyMembership = membership as unknown as { company_id: string; role: string; companies: CompanyProfile | null } | null;
  let company = companyMembership?.companies || null;
  let mode: 'create' | 'claim' | 'edit' | 'read-only' = 'read-only';
  let claimCompanyId: string | undefined;

  if (companyMembership?.role === 'owner' || companyMembership?.role === 'admin') {
    mode = 'edit';
  } else if (companyMembership) {
    mode = 'read-only';
  } else {
    const { data: createdCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (createdCompany) {
      company = createdCompany as unknown as CompanyProfile;
      claimCompanyId = createdCompany.id;
      mode = 'claim';
    } else {
      mode = 'create';
    }
  }

  const initial = company ? {
    name: company.name,
    description: company.description || '',
    website: company.website || company.website_url || '',
    location: company.location || '',
    industry: company.industry || '',
    logo_url: company.logo_url || '',
    facebook_url: company.facebook_url || '',
    instagram_url: company.instagram_url || '',
    linkedin_url: company.linkedin_url || '',
    x_url: company.x_url || '',
    tiktok_url: company.tiktok_url || '',
    youtube_url: company.youtube_url || '',
  } : emptyCompanyProfile;

  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Company Profile</h1><p className={styles.subtitle}>Manage the public information candidates see about your company.</p></header><Card className={styles.legendCard}>{mode === 'read-only' ? <><h2 className={styles.legendTitle}>Company Profile</h2><p>Only company owners and admins can edit this profile.</p></> : <><h2 className={styles.legendTitle}>{mode === 'create' ? 'Company setup' : mode === 'claim' ? 'Claim company' : 'Company profile'}</h2>{mode === 'create' && <p>Create your company profile before posting a job.</p>}{mode === 'claim' && <p>This company was created by your account. Save to claim it and continue setup.</p>}<CompanyForm initial={initial} mode={mode} claimCompanyId={claimCompanyId} /></>}</Card><DeleteAccount /></div></main><Footer /></>;
}

type CompanyProfile = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  website: string | null;
  website_url: string | null;
  industry: string | null;
  logo_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
};

const emptyCompanyProfile = {
  name: '',
  description: '',
  website: '',
  location: '',
  industry: '',
  logo_url: '',
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  x_url: '',
  tiktok_url: '',
  youtube_url: '',
};