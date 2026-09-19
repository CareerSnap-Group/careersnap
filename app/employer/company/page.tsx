import { getEmployerContext } from '@/lib/auth/server';
import { EmployerHeader as Header } from '@/components/layout/employer-header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { DeleteAccount } from '@/components/account/delete-account';
import { CompanyForm } from './company-form';
import styles from '../../applications/applications.module.css';

export default async function EmployerCompanyPage() {
  const { membership } = await getEmployerContext();
  const companyMembership = membership as unknown as { companies: { name: string; description: string | null; location: string | null; website: string | null; website_url: string | null; industry: string | null; logo_url: string | null; facebook_url: string | null; instagram_url: string | null; linkedin_url: string | null; x_url: string | null; tiktok_url: string | null; youtube_url: string | null } | null } | null;
  const company = companyMembership?.companies;
  return <><Header /><main className={styles.page}><div className={styles.container}><header className={styles.header}><h1 className={styles.title}>Company Profile</h1><p className={styles.subtitle}>Manage the public information candidates see about your company.</p></header><Card className={styles.legendCard}>{company ? <CompanyForm initial={{ name: company.name, description: company.description || '', website: company.website || company.website_url || '', location: company.location || '', industry: company.industry || '', logo_url: company.logo_url || '', facebook_url: company.facebook_url || '', instagram_url: company.instagram_url || '', linkedin_url: company.linkedin_url || '', x_url: company.x_url || '', tiktok_url: company.tiktok_url || '', youtube_url: company.youtube_url || '' }} /> : <><h2 className={styles.legendTitle}>Company setup</h2><p>Your company will be created when you post your first job.</p></>}</Card><DeleteAccount /></div></main><Footer /></>;
}